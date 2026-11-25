<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\CloudinaryService;
use App\Support\CatalogCache;
use App\Support\DatabaseTargetGuard;
use App\Support\DemoProductCatalog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class SyncDemoProducts extends Command
{
    protected $signature = 'products:sync-demo
                            {--dry-run : Show the products and image count without writing}
                            {--allow-remote : Permit a non-local database after a separate approval}';

    protected $description = 'Create or update the approved demo products and attach their Cloudinary images.';

    public function __construct(private readonly CloudinaryService $cloudinary)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $products = DemoProductCatalog::products();
        $photoCount = array_sum(array_column($products, 'photo_count'));

        if ($this->option('dry-run')) {
            $this->info(sprintf(
                'Dry run: %d demo products and %d image records; no database or Cloudinary requests.',
                count($products),
                $photoCount,
            ));

            foreach ($products as $product) {
                $this->line(sprintf(
                    'Model %d | %s | tag=%s | photos=%d',
                    $product['model'],
                    $product['display_name'],
                    $product['tag'],
                    $product['photo_count'],
                ));
            }

            return self::SUCCESS;
        }

        if (DatabaseTargetGuard::isRemote() && ! $this->option('allow-remote')) {
            $this->error('Refusing to write to a non-local database. Use --allow-remote only after separate approval.');

            return self::FAILURE;
        }

        $cloudName = trim($this->cloudinary->cloudName());
        if (! preg_match('/^[A-Za-z0-9_-]+$/', $cloudName)) {
            $this->error('Set a valid CLOUDINARY_CLOUD_NAME before syncing demo products.');

            return self::FAILURE;
        }

        if (! $this->confirm(sprintf(
            'Create or update %d demo products and attach %d Cloudinary images?',
            count($products),
            $photoCount,
        ), false)) {
            $this->info('Cancelled; no products were changed.');

            return self::SUCCESS;
        }

        $categories = [];
        $tagNames = ['luxury' => 'Luxury', 'pastel' => 'Pastel', 'set' => 'Set'];
        $sortOrder = ['luxury' => 1, 'pastel' => 2, 'set' => 3];

        DB::transaction(function () use ($products, $cloudName, $tagNames, $sortOrder, &$categories): void {
            foreach ($tagNames as $tag => $name) {
                $category = Category::query()->firstOrCreate(
                    ['slug' => $tag],
                    [
                        'name' => $name,
                        'description' => 'Demo product grouping.',
                        'is_active' => true,
                        'sort_order' => $sortOrder[$tag],
                    ],
                );
                $categories[$tag] = $category->id;
            }

            foreach ($products as $entry) {
                $existingProduct = Product::query()
                    ->where('product_key', $entry['product_key'])
                    ->first();

                if ($existingProduct && ! $existingProduct->is_demo) {
                    throw new RuntimeException(
                        sprintf('Product key "%s" belongs to a non-demo product; refusing to overwrite it.', $entry['product_key'])
                    );
                }

                $product = Product::query()->updateOrCreate(
                    ['product_key' => $entry['product_key']],
                    [
                        'category_id' => $categories[$entry['tag']],
                        'name' => $entry['display_name'],
                        'slug' => Str::slug($entry['display_name']).'-model-'.$entry['model'],
                        'sku' => sprintf('AFIYA-DEMO-%03d', $entry['model']),
                        'short_description' => 'Example demo product.',
                        'description' => 'Demo listing. Replace with original Afiya product details before launch.',
                        'price' => 10.98,
                        'compare_at_price' => null,
                        'stock_quantity' => 100,
                        'track_inventory' => true,
                        'is_active' => true,
                        'is_featured' => false,
                        'is_demo' => true,
                        'published_at' => now(),
                    ],
                );

                for ($photo = 1; $photo <= $entry['photo_count']; $photo++) {
                    $publicId = sprintf('afiya-shope/demo-products/model-%d-%d', $entry['model'], $photo);
                    $existingImage = ProductImage::query()
                        ->where('cloudinary_public_id', $publicId)
                        ->first();

                    if ($existingImage && (int) $existingImage->product_id !== (int) $product->id) {
                        throw new RuntimeException(
                            sprintf('Cloudinary public ID "%s" is already attached to another product; refusing to overwrite it.', $publicId)
                        );
                    }

                    $url = sprintf(
                        'https://res.cloudinary.com/%s/image/upload/f_auto,q_auto/%s.jpg',
                        $cloudName,
                        $publicId,
                    );

                    ProductImage::query()->updateOrCreate(
                        ['cloudinary_public_id' => $publicId],
                        [
                            'product_id' => $product->id,
                            'path' => $url,
                            'url' => $url,
                            'alt_text' => sprintf('%s, photo %d', $entry['display_name'], $photo),
                            'sort_order' => $photo,
                            'is_primary' => $photo === 1,
                        ],
                    );
                }
            }
        });

        CatalogCache::bust();
        $this->info(sprintf(
            'Demo catalog synced: %d products and %d image records. Product prices are stored in USD; KHR display is approximately 45,000.',
            count($products),
            $photoCount,
        ));

        return self::SUCCESS;
    }
}
