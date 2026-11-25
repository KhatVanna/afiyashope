<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class ProductCurrencyFeatureTest extends TestCase
{
    use DatabaseMigrations;

    public function test_catalog_exposes_explicit_product_currency_and_keeps_unset_currency_null(): void
    {
        Product::query()->create([
            'name' => 'Region-based product',
            'slug' => 'region-based-product',
            'sku' => 'REGION-BASED-PRODUCT',
            'price' => 50,
        ]);
        Product::query()->create([
            'name' => 'Riel product',
            'slug' => 'riel-product',
            'sku' => 'RIEL-PRODUCT',
            'price' => 50000,
            'currency' => 'KHR',
        ]);

        $this->getJson('/api/v1/catalog/products')
            ->assertOk()
            ->assertJsonFragment(['slug' => 'region-based-product', 'currency' => null])
            ->assertJsonFragment(['slug' => 'riel-product', 'currency' => 'KHR']);
    }
}
