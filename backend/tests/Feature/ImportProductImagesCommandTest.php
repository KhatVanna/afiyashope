<?php

namespace Tests\Feature;

use App\Services\CloudinaryService;
use Illuminate\Http\Client\ConnectionException;
use Tests\TestCase;

class ImportProductImagesCommandTest extends TestCase
{
    public function test_dry_run_shows_the_plan_without_calling_cloudinary_or_creating_a_log(): void
    {
        $directory = sys_get_temp_dir().DIRECTORY_SEPARATOR.'product-import-'.bin2hex(random_bytes(6));
        mkdir($directory);
        file_put_contents($directory.DIRECTORY_SEPARATOR.'model-1-1.jpg', 'prepared image');
        file_put_contents(
            $directory.DIRECTORY_SEPARATOR.'mapping.csv',
            "model,product_key,display_name,photo,original_name,new_name\n".
            "1,TEAMGEIST,Teamgeist Adicolor Track Top Black,1,original.avif,model-1-1.jpg\n",
        );
        $logPath = $directory.DIRECTORY_SEPARATOR.'import.jsonl';

        $this->beforeApplicationDestroyed(function () use ($directory): void {
            foreach (glob($directory.DIRECTORY_SEPARATOR.'*') ?: [] as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            rmdir($directory);
        });

        $cloudinary = $this->mock(CloudinaryService::class);
        $cloudinary->shouldNotReceive('uploadWithoutOverwrite');
        $cloudinary->shouldNotReceive('assertConfigured');

        $this->artisan('products:import-images', [
            'path' => $directory,
            '--dry-run' => true,
            '--log' => $logPath,
        ])
            ->expectsOutput('Dry run: 1 image(s) ready; no Cloudinary requests will be sent.')
            ->expectsOutput('Cloudinary folder: afiya-shope/demo-products')
            ->expectsOutput('Model 1 photo 1 | Teamgeist Adicolor Track Top Black | afiya-shope/demo-products/model-1-1')
            ->assertExitCode(0);

        $this->assertFileDoesNotExist($logPath);
    }

    public function test_dry_run_rejects_a_mapping_that_points_outside_the_prepared_directory(): void
    {
        $directory = sys_get_temp_dir().DIRECTORY_SEPARATOR.'product-import-'.bin2hex(random_bytes(6));
        mkdir($directory);
        file_put_contents(
            $directory.DIRECTORY_SEPARATOR.'mapping.csv',
            "model,product_key,display_name,photo,original_name,new_name\n".
            "1,TEAMGEIST,Teamgeist Adicolor Track Top Black,1,original.avif,../outside.jpg\n",
        );

        $this->beforeApplicationDestroyed(function () use ($directory): void {
            foreach (glob($directory.DIRECTORY_SEPARATOR.'*') ?: [] as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            rmdir($directory);
        });

        $this->artisan('products:import-images', [
            'path' => $directory,
            '--dry-run' => true,
        ])
            ->expectsOutput('mapping.csv row 2 has an invalid new_name.')
            ->assertExitCode(1);
    }

    public function test_failure_log_records_curl_number_and_redacts_urls_and_credentials(): void
    {
        $directory = sys_get_temp_dir().DIRECTORY_SEPARATOR.'product-import-'.bin2hex(random_bytes(6));
        mkdir($directory);
        file_put_contents($directory.DIRECTORY_SEPARATOR.'model-1-1.jpg', 'prepared image');
        file_put_contents(
            $directory.DIRECTORY_SEPARATOR.'mapping.csv',
            "model,product_key,display_name,photo,original_name,new_name\n".
            "1,TEAMGEIST,Teamgeist Adicolor Track Top Black,1,original.avif,model-1-1.jpg\n",
        );
        $logPath = $directory.DIRECTORY_SEPARATOR.'import.jsonl';
        config([
            'services.cloudinary.api_key' => 'test-api-key-value',
            'services.cloudinary.api_secret' => 'test-api-secret-value',
        ]);

        $this->beforeApplicationDestroyed(function () use ($directory): void {
            foreach (glob($directory.DIRECTORY_SEPARATOR.'*') ?: [] as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            rmdir($directory);
        });

        $cloudinary = $this->mock(CloudinaryService::class);
        $cloudinary->shouldReceive('assertConfigured')->once();
        $cloudinary->shouldReceive('uploadWithoutOverwrite')
            ->once()
            ->andThrow(new ConnectionException(
                'cURL error 60: SSL certificate problem: unable to get local issuer certificate '.
                '(see https://curl.example/help) for https://api.cloudinary.com/upload?api_key=test-api-key-value',
            ));

        $this->artisan('products:import-images', [
            'path' => $directory,
            '--max-attempts' => 1,
            '--retry-delay' => 0,
            '--log' => $logPath,
        ])->assertExitCode(1);

        $entry = json_decode(file_get_contents($logPath), true, flags: JSON_THROW_ON_ERROR);
        $encodedEntry = json_encode($entry, JSON_THROW_ON_ERROR);

        $this->assertSame(60, $entry['curl_error_number']);
        $this->assertSame(
            'SSL certificate problem: unable to get local issuer certificate',
            $entry['sanitized_error_message'],
        );
        $this->assertStringNotContainsString('https://', $encodedEntry);
        $this->assertStringNotContainsString('test-api-key-value', $encodedEntry);
        $this->assertStringNotContainsString('test-api-secret-value', $encodedEntry);
    }
}
