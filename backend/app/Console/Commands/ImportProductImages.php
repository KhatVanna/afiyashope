<?php

namespace App\Console\Commands;

use App\Services\CloudinaryService;
use Illuminate\Console\Command;
use JsonException;
use RuntimeException;
use Throwable;

class ImportProductImages extends Command
{
    private const CLOUDINARY_FOLDER = 'afiya-shope/demo-products';

    protected $signature = 'products:import-images
                            {path : Directory containing mapping.csv and the prepared JPG files}
                            {--dry-run : Show the upload plan without contacting Cloudinary}
                            {--retry-failures : Retry only public IDs whose latest log status is failure}
                            {--batch-size=10 : Number of files in each upload batch}
                            {--max-attempts=3 : Maximum attempts per file}
                            {--retry-delay=1 : Initial retry delay in seconds}
                            {--log= : Append-only JSONL result log path}';

    protected $description = 'Import prepared demo product images to Cloudinary.';

    public function __construct(private readonly CloudinaryService $cloudinary)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        try {
            $rows = $this->readMapping((string) $this->argument('path'));
            $logPath = $this->logPath();

            if ($this->option('retry-failures')) {
                $rows = $this->onlyFailedRows($rows, $logPath);
            }

            $batchSize = $this->positiveOption('batch-size', 100);
            $maxAttempts = $this->positiveOption('max-attempts', 10);
            $retryDelay = $this->nonNegativeOption('retry-delay', 60);
        } catch (RuntimeException|JsonException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        if ($this->option('dry-run')) {
            $this->info(sprintf(
                'Dry run: %d image(s) ready; no Cloudinary requests will be sent.',
                count($rows),
            ));
            $this->line('Cloudinary folder: '.self::CLOUDINARY_FOLDER);

            foreach ($rows as $row) {
                $this->line(sprintf(
                    'Model %d photo %d | %s | %s',
                    $row['model'],
                    $row['photo'],
                    $row['display_name'],
                    $row['public_id'],
                ));
            }

            return self::SUCCESS;
        }

        if ($rows === []) {
            $this->info('No images to import.');

            return self::SUCCESS;
        }

        try {
            $this->cloudinary->assertConfigured();
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $successes = 0;
        $failures = [];
        $progress = $this->output->createProgressBar(count($rows));
        $progress->start();

        foreach (array_chunk($rows, $batchSize) as $batch) {
            foreach ($batch as $row) {
                $attempts = 0;
                $lastError = null;

                while ($attempts < $maxAttempts) {
                    $attempts++;

                    try {
                        $this->cloudinary->uploadWithoutOverwrite(
                            $row['absolute_path'],
                            $row['public_id'],
                            self::CLOUDINARY_FOLDER,
                        );
                        $this->appendLog($logPath, $row, 'success', $attempts);
                        $successes++;
                        $lastError = null;

                        break;
                    } catch (Throwable $exception) {
                        $lastError = $exception;

                        if ($attempts < $maxAttempts) {
                            $delay = min(
                                (int) $this->option('retry-delay') * (2 ** ($attempts - 1)),
                                60,
                            );
                            $progress->clear();
                            $this->warn(sprintf(
                                'Retrying model %d photo %d after attempt %d (%s).',
                                $row['model'],
                                $row['photo'],
                                $attempts,
                                $exception::class,
                            ));
                            $progress->display();
                            if ($delay > 0) {
                                sleep($delay);
                            }
                        }
                    }
                }

                if ($lastError !== null) {
                    $errorDetails = $this->errorDetails($lastError);
                    $this->appendLog($logPath, $row, 'failure', $attempts, $lastError);
                    $failures[] = $row;
                    $progress->clear();
                    $this->error(sprintf(
                        'Failed model %d photo %d after %d attempt(s) (%s): %s',
                        $row['model'],
                        $row['photo'],
                        $attempts,
                        $lastError::class,
                        $this->formatErrorDetails($errorDetails),
                    ));
                    $progress->display();
                }

                $progress->advance();
            }
        }

        $progress->finish();
        $this->newLine(2);
        $this->info(sprintf(
            'Import complete: %d succeeded, %d failed. Log: %s',
            $successes,
            count($failures),
            $logPath,
        ));

        return $failures === [] ? self::SUCCESS : self::FAILURE;
    }

    /**
     * @return list<array{model: int, photo: int, product_key: string, display_name: string, original_name: string, new_name: string, absolute_path: string, public_id: string}>
     */
    private function readMapping(string $directory): array
    {
        $root = realpath($directory);
        if ($root === false || ! is_dir($root)) {
            throw new RuntimeException('The import path must be an existing directory.');
        }

        $mappingPath = $root.DIRECTORY_SEPARATOR.'mapping.csv';
        if (! is_file($mappingPath)) {
            throw new RuntimeException('mapping.csv is missing from the import directory.');
        }

        $handle = fopen($mappingPath, 'rb');
        if ($handle === false) {
            throw new RuntimeException('Unable to read mapping.csv.');
        }

        try {
            $headers = fgetcsv($handle, 0, ',', '"', '');
            if ($headers === false) {
                throw new RuntimeException('mapping.csv is empty.');
            }

            $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headers[0]);
            $required = ['model', 'product_key', 'display_name', 'photo', 'original_name', 'new_name'];
            if (array_diff($required, $headers) !== []) {
                throw new RuntimeException('mapping.csv is missing one or more required columns.');
            }

            $indexes = array_flip($headers);
            $rows = [];
            $seenPublicIds = [];
            $line = 1;

            while (($values = fgetcsv($handle, 0, ',', '"', '')) !== false) {
                $line++;
                if ($values === [null]) {
                    continue;
                }

                if (count($values) !== count($headers)) {
                    throw new RuntimeException("mapping.csv row {$line} has an invalid number of columns.");
                }

                $model = filter_var($values[$indexes['model']], FILTER_VALIDATE_INT);
                $photo = filter_var($values[$indexes['photo']], FILTER_VALIDATE_INT);
                $productKey = trim($values[$indexes['product_key']]);
                $displayName = trim($values[$indexes['display_name']]);
                $originalName = trim($values[$indexes['original_name']]);
                $newName = trim($values[$indexes['new_name']]);

                if ($model === false || $model < 1 || $photo === false || $photo < 1
                    || $productKey === '' || $displayName === '' || $originalName === '') {
                    throw new RuntimeException("mapping.csv row {$line} contains invalid product data.");
                }

                if (! preg_match('/^model-(\d+)-(\d+)\.jpg$/', $newName, $matches)
                    || (int) $matches[1] !== $model
                    || (int) $matches[2] !== $photo) {
                    throw new RuntimeException("mapping.csv row {$line} has an invalid new_name.");
                }

                $absolutePath = realpath($root.DIRECTORY_SEPARATOR.$newName);
                if (
                    $absolutePath === false
                    || ! is_file($absolutePath)
                    || ! str_starts_with($absolutePath, $root.DIRECTORY_SEPARATOR)
                ) {
                    throw new RuntimeException("The prepared image for mapping.csv row {$line} is missing.");
                }

                $publicId = self::CLOUDINARY_FOLDER.'/model-'.$model.'-'.$photo;
                if (isset($seenPublicIds[$publicId])) {
                    throw new RuntimeException("mapping.csv contains duplicate model/photo entry at row {$line}.");
                }
                $seenPublicIds[$publicId] = true;

                $rows[] = [
                    'model' => $model,
                    'photo' => $photo,
                    'product_key' => $productKey,
                    'display_name' => $displayName,
                    'original_name' => $originalName,
                    'new_name' => $newName,
                    'absolute_path' => $absolutePath,
                    'public_id' => $publicId,
                ];
            }
        } finally {
            fclose($handle);
        }

        if ($rows === []) {
            throw new RuntimeException('mapping.csv contains no images to import.');
        }

        return $rows;
    }

    /**
     * @param  list<array{public_id: string}>  $rows
     * @return list<array{model: int, photo: int, product_key: string, display_name: string, original_name: string, new_name: string, absolute_path: string, public_id: string}>
     *
     * @throws JsonException
     */
    private function onlyFailedRows(array $rows, string $logPath): array
    {
        if (! is_file($logPath)) {
            throw new RuntimeException('No import log exists to identify failed uploads.');
        }

        $contents = file_get_contents($logPath);
        if ($contents === false) {
            throw new RuntimeException('Unable to read the import log.');
        }

        $latestStatus = [];
        foreach (explode("\n", $contents) as $lineNumber => $line) {
            if (trim($line) === '') {
                continue;
            }

            $entry = json_decode($line, true, flags: JSON_THROW_ON_ERROR);
            if (
                ! is_array($entry)
                || ! is_string($entry['public_id'] ?? null)
                || ! in_array($entry['status'] ?? null, ['success', 'failure'], true)
            ) {
                throw new RuntimeException('The import log has an invalid entry on line '.($lineNumber + 1).'.');
            }

            $latestStatus[$entry['public_id']] = $entry['status'];
        }

        $failedIds = array_keys(array_filter(
            $latestStatus,
            static fn (string $status): bool => $status === 'failure',
        ));
        if ($failedIds === []) {
            $this->info('No failed uploads found in the latest import log.');

            return [];
        }

        $failedSet = array_fill_keys($failedIds, true);
        $filtered = array_values(array_filter(
            $rows,
            static fn (array $row): bool => isset($failedSet[$row['public_id']]),
        ));
        if (count($filtered) !== count($failedIds)) {
            throw new RuntimeException('Some failed public IDs in the log do not match this mapping.csv.');
        }

        return $filtered;
    }

    private function appendLog(
        string $path,
        array $row,
        string $status,
        int $attempts,
        ?Throwable $exception = null,
    ): void {
        $directory = dirname($path);
        if (! is_dir($directory) && ! mkdir($directory, 0775, true) && ! is_dir($directory)) {
            throw new RuntimeException('Unable to create the import log directory.');
        }

        $entry = [
            'recorded_at' => now()->toIso8601String(),
            'status' => $status,
            'model' => $row['model'],
            'photo' => $row['photo'],
            'public_id' => $row['public_id'],
            'new_name' => $row['new_name'],
            'attempts' => $attempts,
        ];
        if ($exception !== null) {
            $entry['error_class'] = $exception::class;
            $entry += $this->errorDetails($exception);
        }

        $json = json_encode($entry, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        if (file_put_contents($path, $json.PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
            throw new RuntimeException('Unable to append to the import log.');
        }
    }

    /**
     * @return array{curl_error_number: int|null, sanitized_error_message: string}
     */
    private function errorDetails(Throwable $exception): array
    {
        $message = $exception->getMessage();
        $curlErrorNumber = null;

        if (preg_match('/\bcURL error (\d+):\s*(.*?)(?:\s+\(see https?:\/\/|\s+for https?:\/\/|$)/i', $message, $matches)) {
            $curlErrorNumber = (int) $matches[1];
            $message = $matches[2];
        } elseif (preg_match('/\bcURL error (\d+):/i', $message, $matches)) {
            $curlErrorNumber = (int) $matches[1];
        }

        foreach ([
            (string) config('services.cloudinary.api_key', ''),
            (string) config('services.cloudinary.api_secret', ''),
        ] as $credential) {
            if ($credential !== '') {
                $message = str_replace($credential, '[REDACTED]', $message);
            }
        }

        $message = preg_replace('~https?://[^\s)]+~i', '[URL REDACTED]', $message) ?? $message;
        $message = preg_replace(
            '/\b(api_key|api_secret|signature|authorization)\s*[:=]\s*[^&\s,]+/i',
            '$1=[REDACTED]',
            $message,
        ) ?? $message;
        $message = trim(preg_replace('/[\r\n\t]+/', ' ', $message) ?? $message);

        return [
            'curl_error_number' => $curlErrorNumber,
            'sanitized_error_message' => substr($message !== '' ? $message : 'No diagnostic message available.', 0, 500),
        ];
    }

    /**
     * @param  array{curl_error_number: int|null, sanitized_error_message: string}  $details
     */
    private function formatErrorDetails(array $details): string
    {
        return $details['curl_error_number'] !== null
            ? 'cURL error '.$details['curl_error_number'].': '.$details['sanitized_error_message']
            : $details['sanitized_error_message'];
    }

    private function logPath(): string
    {
        $configuredPath = trim((string) $this->option('log'));

        return $configuredPath !== ''
            ? $configuredPath
            : storage_path('logs/product-image-import.jsonl');
    }

    private function positiveOption(string $name, int $maximum): int
    {
        $value = filter_var($this->option($name), FILTER_VALIDATE_INT);
        if ($value === false || $value < 1 || $value > $maximum) {
            throw new RuntimeException("Option --{$name} must be between 1 and {$maximum}.");
        }

        return $value;
    }

    private function nonNegativeOption(string $name, int $maximum): int
    {
        $value = filter_var($this->option($name), FILTER_VALIDATE_INT);
        if ($value === false || $value < 0 || $value > $maximum) {
            throw new RuntimeException("Option --{$name} must be between 0 and {$maximum}.");
        }

        return $value;
    }
}
