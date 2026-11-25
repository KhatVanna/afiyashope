<?php

namespace Tests\Unit;

use App\Services\CloudinaryService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CloudinaryServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.cloudinary.cloud_name' => 'demo-cloud',
            'services.cloudinary.api_key' => 'demo-api-key',
            'services.cloudinary.api_secret' => 'demo-api-secret',
        ]);
    }

    public function test_upload_without_overwrite_returns_an_existing_asset_without_uploading_again(): void
    {
        Http::fake(function (Request $request) {
            return Http::response([
                'secure_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/afiya-shope/demo-products/model-1-1.jpg',
                'public_id' => 'afiya-shope/demo-products/model-1-1',
            ]);
        });

        $asset = app(CloudinaryService::class)->uploadWithoutOverwrite(
            __FILE__,
            'afiya-shope/demo-products/model-1-1',
            'afiya-shope/demo-products',
        );

        $this->assertSame('afiya-shope/demo-products/model-1-1', $asset['public_id']);
        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request): bool => $request->method() === 'GET');
    }

    public function test_upload_without_overwrite_disables_replacement_for_a_new_asset(): void
    {
        Http::fake(function (Request $request) {
            if ($request->method() === 'GET') {
                return Http::response([], 404);
            }

            return Http::response([
                'secure_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/afiya-shope/demo-products/model-1-1.jpg',
                'public_id' => 'afiya-shope/demo-products/model-1-1',
            ]);
        });

        $asset = app(CloudinaryService::class)->uploadWithoutOverwrite(
            __FILE__,
            'afiya-shope/demo-products/model-1-1',
            'afiya-shope/demo-products',
        );

        $this->assertSame('afiya-shope/demo-products/model-1-1', $asset['public_id']);
        Http::assertSentCount(2);
        Http::assertSent(function (Request $request): bool {
            if ($request->method() !== 'POST' || ! $request->isMultipart()) {
                return false;
            }

            $body = $request->body();

            return str_contains($body, 'name="public_id"')
                && str_contains($body, 'afiya-shope/demo-products/model-1-1')
                && str_contains($body, 'name="overwrite"')
                && str_contains($body, 'false');
        });
    }

    public function test_missing_optional_ca_bundle_uses_the_system_ca_store(): void
    {
        config([
            'services.cloudinary.ca_bundle' => storage_path('testing/missing-ca-bundle.pem'),
        ]);
        Http::fake([
            '*' => Http::response([
                'secure_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/test-image.jpg',
                'public_id' => 'test-image',
            ]),
        ]);

        $asset = app(CloudinaryService::class)->uploadLocalFile(
            __FILE__,
            'test-image',
            'test-folder',
        );

        $this->assertSame('test-image', $asset['public_id']);
        Http::assertSentCount(1);
    }

    public function test_extract_public_id_preserves_folder_after_delivery_transformations(): void
    {
        $publicId = app(CloudinaryService::class)->extractPublicIdFromUrl(
            'https://res.cloudinary.com/demo-cloud/image/upload/f_auto,q_auto/afiya-shope/demo-products/model-25-1.jpg',
        );

        $this->assertSame('afiya-shope/demo-products/model-25-1', $publicId);
    }
}
