<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use RuntimeException;
use Tests\TestCase;

class DemoProductsCommandTest extends TestCase
{
    use DatabaseMigrations;

    public function test_sync_demo_dry_run_does_not_require_cloudinary_or_write_data(): void
    {
        $this->artisan('products:sync-demo', ['--dry-run' => true])
            ->expectsOutput('Dry run: 29 demo products and 116 image records; no database or Cloudinary requests.')
            ->assertExitCode(0);

        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('product_images', 0);
    }

    public function test_sync_demo_creates_products_and_cloudinary_images_idempotently(): void
    {
        config(['services.cloudinary.cloud_name' => 'demo-cloud']);
        Category::query()->create([
            'name' => 'Existing Luxury',
            'slug' => 'luxury',
            'description' => 'Keep this category unchanged.',
            'is_active' => false,
            'sort_order' => 99,
        ]);

        $cloudinary = $this->mock(CloudinaryService::class);
        $cloudinary->shouldReceive('cloudName')->twice()->andReturn('demo-cloud');
        $cloudinary->shouldNotReceive('assertConfigured');

        $this->artisan('products:sync-demo')
            ->expectsConfirmation(
                'Create or update 29 demo products and attach 116 Cloudinary images?',
                'yes',
            )
            ->expectsOutput('Demo catalog synced: 29 products and 116 image records. Product prices are stored in USD; KHR display is approximately 45,000.')
            ->assertExitCode(0);

        $this->assertDatabaseCount('products', 29);
        $this->assertDatabaseCount('product_images', 116);
        $this->assertDatabaseHas('products', [
            'product_key' => 'Teamgeist_Adicolor_Track_Top_Black_KD5858',
            'name' => 'Adidas Teamgeist Adicolor Track Top Black',
            'price' => '10.98',
            'is_demo' => true,
        ]);
        $this->assertDatabaseHas('product_images', [
            'cloudinary_public_id' => 'afiya-shope/demo-products/model-25-1',
            'url' => 'https://res.cloudinary.com/demo-cloud/image/upload/f_auto,q_auto/afiya-shope/demo-products/model-25-1.jpg',
            'sort_order' => 1,
            'is_primary' => true,
        ]);

        $this->artisan('products:sync-demo')
            ->expectsConfirmation(
                'Create or update 29 demo products and attach 116 Cloudinary images?',
                'yes',
            )
            ->assertExitCode(0);

        $this->assertDatabaseCount('products', 29);
        $this->assertDatabaseCount('product_images', 116);
        $this->assertDatabaseHas('categories', [
            'slug' => 'luxury',
            'name' => 'Existing Luxury',
            'description' => 'Keep this category unchanged.',
            'is_active' => false,
            'sort_order' => 99,
        ]);
    }

    public function test_sync_demo_refuses_to_overwrite_a_non_demo_product_key(): void
    {
        config(['services.cloudinary.cloud_name' => 'demo-cloud']);
        $this->mock(CloudinaryService::class)
            ->shouldReceive('cloudName')
            ->once()
            ->andReturn('demo-cloud');
        Product::query()->create([
            'name' => 'Existing Product',
            'slug' => 'existing-product',
            'sku' => 'EXISTING-PRODUCT',
            'price' => 12.00,
            'stock_quantity' => 1,
            'is_demo' => false,
            'product_key' => 'Teamgeist_Adicolor_Track_Top_Black_KD5858',
        ]);

        try {
            $this->artisan('products:sync-demo')
                ->expectsConfirmation(
                    'Create or update 29 demo products and attach 116 Cloudinary images?',
                    'yes',
                );
            $this->fail('Expected sync to refuse overwriting a non-demo product.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Product key "Teamgeist_Adicolor_Track_Top_Black_KD5858" belongs to a non-demo product; refusing to overwrite it.',
                $exception->getMessage(),
            );
        }

        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseHas('products', [
            'product_key' => 'Teamgeist_Adicolor_Track_Top_Black_KD5858',
            'name' => 'Existing Product',
            'is_demo' => false,
        ]);
        $this->assertDatabaseCount('categories', 0);
        $this->assertDatabaseCount('product_images', 0);
    }

    public function test_remove_demo_dry_run_preserves_products_and_does_not_contact_cloudinary(): void
    {
        $product = $this->createDemoProduct();
        $this->createImage($product);

        $this->mock(CloudinaryService::class)
            ->shouldNotReceive('destroy');

        $this->artisan('products:remove-demo', ['--dry-run' => true])
            ->expectsOutput('Dry run: found 1 demo product(s) and 1 image record(s); nothing deleted.')
            ->assertExitCode(0);

        $this->assertDatabaseHas('products', ['id' => $product->id]);
        $this->assertDatabaseHas('product_images', ['product_id' => $product->id]);
    }

    public function test_remove_demo_refuses_remote_database_even_for_dry_run(): void
    {
        $defaultConnection = config('database.default');
        $pgsqlConnection = config('database.connections.pgsql');

        config([
            'database.default' => 'pgsql',
            'database.connections.pgsql.driver' => 'pgsql',
            'database.connections.pgsql.url' => null,
            'database.connections.pgsql.host' => 'remote.example',
        ]);

        try {
            $this->artisan('products:remove-demo', ['--dry-run' => true])
                ->expectsOutput('Refusing to access a non-local database. Use --allow-remote only after separate approval.')
                ->assertExitCode(1);
        } finally {
            config([
                'database.default' => $defaultConnection,
                'database.connections.pgsql' => $pgsqlConnection,
            ]);
        }
    }

    public function test_remove_demo_requires_confirmation_and_deletes_cloudinary_and_database_records(): void
    {
        $product = $this->createDemoProduct();
        $this->createImage($product);

        $this->mock(CloudinaryService::class)
            ->shouldReceive('destroy')
            ->once()
            ->with('afiya-shope/demo-products/model-1-1')
            ->andReturn(true);

        $this->artisan('products:remove-demo')
            ->expectsConfirmation(
                'Permanently delete 1 demo product(s), 1 image record(s), and their Cloudinary files?',
                'yes',
            )
            ->expectsOutput('Removed 1 demo product(s), 1 image record(s), and their Cloudinary assets.')
            ->assertExitCode(0);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseMissing('product_images', ['product_id' => $product->id]);
    }

    private function createDemoProduct(): Product
    {
        return Product::query()->create([
            'name' => 'Demo Product',
            'slug' => 'demo-product',
            'sku' => 'DEMO-PRODUCT-1',
            'price' => 10.98,
            'stock_quantity' => 1,
            'is_demo' => true,
            'product_key' => 'demo-product-key',
        ]);
    }

    private function createImage(Product $product): ProductImage
    {
        return $product->images()->create([
            'path' => 'https://res.cloudinary.com/demo-cloud/image/upload/f_auto,q_auto/afiya-shope/demo-products/model-1-1.jpg',
            'url' => 'https://res.cloudinary.com/demo-cloud/image/upload/f_auto,q_auto/afiya-shope/demo-products/model-1-1.jpg',
            'cloudinary_public_id' => 'afiya-shope/demo-products/model-1-1',
            'sort_order' => 1,
            'is_primary' => true,
        ]);
    }
}
