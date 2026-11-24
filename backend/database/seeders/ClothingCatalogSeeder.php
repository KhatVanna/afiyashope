<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class ClothingCatalogSeeder extends Seeder
{
    private const COLORS = ['Black', 'White', 'Navy', 'Sage Green'];

    private const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

    private const KIDS_SIZES = ['2Y', '4Y', '6Y', '8Y', '10Y'];

    public function run(): void
    {
        $result = DB::transaction(function (): array {
            $now = now();
            $categories = [
                'afiya-womens-apparel' => "Women's Clothing",
                'afiya-mens-apparel' => "Men's Clothing",
                'afiya-unisex-apparel' => 'Unisex Clothing',
                'afiya-kids-apparel' => "Kids' Clothing",
            ];
            $categoryRows = [];
            foreach ($categories as $slug => $name) {
                $categoryRows[] = [
                    'name' => $name,
                    'slug' => $slug,
                    'description' => $name.' at Afiya Shope',
                    'is_active' => true,
                    'sort_order' => count($categoryRows) + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('categories')->insertOrIgnore($categoryRows);

            $categoryIds = DB::table('categories')
                ->whereIn('slug', array_keys($categories))
                ->whereNull('deleted_at')
                ->pluck('id', 'slug')
                ->all();
            if (count($categoryIds) !== count($categories)) {
                throw new RuntimeException('Could not resolve all apparel categories.');
            }

            $brands = [
                'afiya-everyday' => 'Afiya Everyday',
                'afiya-active' => 'Afiya Active',
                'afiya-kids' => 'Afiya Kids',
            ];
            $brandRows = [];
            foreach ($brands as $slug => $name) {
                $brandRows[] = [
                    'name' => $name,
                    'slug' => $slug,
                    'description' => $name.' apparel',
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('brands')->insertOrIgnore($brandRows);

            $brandIds = DB::table('brands')
                ->whereIn('slug', array_keys($brands))
                ->whereNull('deleted_at')
                ->pluck('id', 'slug')
                ->all();
            if (count($brandIds) !== count($brands)) {
                throw new RuntimeException('Could not resolve all apparel brands.');
            }

            $styles = [
                ['Womens Classic Cotton T-Shirt', 'afiya-womens-apparel', 'afiya-everyday', 9.50, 'adult'],
                ['Womens Relaxed Linen Blouse', 'afiya-womens-apparel', 'afiya-everyday', 18.00, 'adult'],
                ['Womens Floral Midi Dress', 'afiya-womens-apparel', 'afiya-everyday', 28.00, 'adult'],
                ['Womens Straight-Leg Jeans', 'afiya-womens-apparel', 'afiya-everyday', 29.00, 'adult'],
                ['Womens Cotton Hoodie', 'afiya-womens-apparel', 'afiya-active', 24.00, 'adult'],
                ['Womens Active Leggings', 'afiya-womens-apparel', 'afiya-active', 18.00, 'adult'],
                ['Womens Knit Cardigan', 'afiya-womens-apparel', 'afiya-everyday', 25.00, 'adult'],
                ['Womens Pleated Midi Skirt', 'afiya-womens-apparel', 'afiya-everyday', 21.00, 'adult'],
                ['Womens Cotton Pajama Set', 'afiya-womens-apparel', 'afiya-everyday', 24.00, 'adult'],
                ['Womens Lightweight Jacket', 'afiya-womens-apparel', 'afiya-active', 33.00, 'adult'],
                ['Mens Oxford Button-Down Shirt', 'afiya-mens-apparel', 'afiya-everyday', 24.00, 'adult'],
                ['Mens Classic Polo Shirt', 'afiya-mens-apparel', 'afiya-everyday', 16.00, 'adult'],
                ['Mens Denim Jeans', 'afiya-mens-apparel', 'afiya-everyday', 30.00, 'adult'],
                ['Mens Cotton Joggers', 'afiya-mens-apparel', 'afiya-active', 22.00, 'adult'],
                ['Mens Zip-Up Hoodie', 'afiya-mens-apparel', 'afiya-active', 27.00, 'adult'],
                ['Mens Performance T-Shirt', 'afiya-mens-apparel', 'afiya-active', 13.00, 'adult'],
                ['Mens Chino Shorts', 'afiya-mens-apparel', 'afiya-everyday', 18.00, 'adult'],
                ['Mens Linen Button-Down Shirt', 'afiya-mens-apparel', 'afiya-everyday', 24.00, 'adult'],
                ['Unisex Oversized T-Shirt', 'afiya-unisex-apparel', 'afiya-everyday', 15.00, 'adult'],
                ['Unisex Crewneck Sweatshirt', 'afiya-unisex-apparel', 'afiya-active', 26.00, 'adult'],
                ['Unisex Lightweight Rain Jacket', 'afiya-unisex-apparel', 'afiya-active', 34.00, 'adult'],
                ['Kids Cotton T-Shirt', 'afiya-kids-apparel', 'afiya-kids', 7.00, 'kids'],
                ['Kids Stretch Leggings', 'afiya-kids-apparel', 'afiya-kids', 8.50, 'kids'],
                ['Kids Hooded Sweatshirt', 'afiya-kids-apparel', 'afiya-kids', 15.00, 'kids'],
                ['Kids Denim Jacket', 'afiya-kids-apparel', 'afiya-kids', 20.00, 'kids'],
            ];

            $productRows = [];
            $productSkus = [];
            $variantRows = [];
            $variantSkus = [];
            $sequence = 0;

            foreach ($styles as [$styleName, $categorySlug, $brandSlug, $price, $audience]) {
                foreach (self::COLORS as $color) {
                    $sequence++;
                    $name = $styleName.' - '.$color;
                    $sku = sprintf('AFS-CLO-%04d', $sequence);
                    $slug = Str::slug($name);
                    $productSkus[] = $sku;

                    $productRows[] = [
                        'category_id' => $categoryIds[$categorySlug],
                        'brand_id' => $brandIds[$brandSlug],
                        'name' => $name,
                        'slug' => $slug,
                        'sku' => $sku,
                        'short_description' => $name.' available in multiple sizes.',
                        'description' => 'Everyday apparel in '.$color.'. Select a size to see available stock.',
                        'price' => number_format($price, 2, '.', ''),
                        'compare_at_price' => null,
                        'cost_price' => null,
                        'stock_quantity' => count($audience === 'kids' ? self::KIDS_SIZES : self::ADULT_SIZES) * 4,
                        'track_inventory' => true,
                        'is_active' => true,
                        'is_featured' => false,
                        'average_rating' => '0.00',
                        'reviews_count' => 0,
                        'sales_count' => 0,
                        'meta_title' => $name.' | Afiya Shope',
                        'meta_description' => 'Shop '.$name.' at Afiya Shope.',
                        'published_at' => $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    $sizes = $audience === 'kids' ? self::KIDS_SIZES : self::ADULT_SIZES;
                    foreach ($sizes as $size) {
                        $variantSku = $sku.'-'.$size;
                        $variantSkus[] = $variantSku;
                        $variantRows[] = [
                            'product_sku' => $sku,
                            'sku' => $variantSku,
                            'name' => $size,
                            'price' => number_format($price, 2, '.', ''),
                            'compare_at_price' => null,
                            'stock_quantity' => 4,
                            'is_active' => true,
                            'attribute_data' => json_encode(
                                ['size' => $size, 'color' => $color],
                                JSON_THROW_ON_ERROR
                            ),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
            }

            if ($sequence !== 100) {
                throw new RuntimeException("Expected 100 clothing products; generated {$sequence}.");
            }

            $insertedProducts = DB::table('products')->insertOrIgnore($productRows);
            $productIdBySku = DB::table('products')
                ->whereIn('sku', $productSkus)
                ->pluck('id', 'sku')
                ->all();
            if (count($productIdBySku) !== 100) {
                throw new RuntimeException('Could not resolve all 100 apparel products.');
            }

            $variantInsertRows = [];
            foreach ($variantRows as $variant) {
                $variantInsertRows[] = [
                    'product_id' => $productIdBySku[$variant['product_sku']],
                    'sku' => $variant['sku'],
                    'name' => $variant['name'],
                    'price' => $variant['price'],
                    'compare_at_price' => $variant['compare_at_price'],
                    'stock_quantity' => $variant['stock_quantity'],
                    'is_active' => $variant['is_active'],
                    'attribute_data' => $variant['attribute_data'],
                    'created_at' => $variant['created_at'],
                    'updated_at' => $variant['updated_at'],
                ];
            }
            $insertedVariants = DB::table('product_variants')->insertOrIgnore($variantInsertRows);

            $variantIdBySku = DB::table('product_variants')
                ->whereIn('sku', $variantSkus)
                ->pluck('id', 'sku')
                ->all();
            if (count($variantIdBySku) !== count($variantSkus)) {
                throw new RuntimeException('Could not resolve all apparel size variants.');
            }

            $inventoryRows = [];
            foreach ($variantRows as $variant) {
                $inventoryRows[] = [
                    'product_id' => $productIdBySku[$variant['product_sku']],
                    'product_variant_id' => $variantIdBySku[$variant['sku']],
                    'quantity' => 4,
                    'reserved_quantity' => 0,
                    'low_stock_threshold' => 2,
                    'warehouse' => 'main',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            $insertedInventory = DB::table('inventories')->insertOrIgnore($inventoryRows);

            $productCount = DB::table('products')->whereIn('sku', $productSkus)->count();
            $variantCount = DB::table('product_variants')->whereIn('sku', $variantSkus)->count();
            $inventoryCount = DB::table('inventories')
                ->whereIn('product_id', array_values($productIdBySku))
                ->count();
            if ($productCount !== 100 || $variantCount !== count($variantSkus) || $inventoryCount !== count($variantSkus)) {
                throw new RuntimeException('Post-insert apparel catalog verification failed.');
            }

            return [
                'products' => $insertedProducts,
                'variants' => $insertedVariants,
                'inventory' => $insertedInventory,
            ];
        });

        $this->command?->info(sprintf(
            'Apparel import complete: %d new products, %d new size variants, and %d inventory rows. Existing records were preserved.',
            $result['products'],
            $result['variants'],
            $result['inventory']
        ));
    }
}
