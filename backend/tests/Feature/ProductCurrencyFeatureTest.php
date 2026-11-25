<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
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

        $this->getJson('/api/v1/catalog/products/riel-product')
            ->assertOk()
            ->assertJsonPath('data.product.currency', 'KHR');
    }

    public function test_admin_update_persists_product_currency(): void
    {
        $permission = Permission::query()->create([
            'name' => 'Update products',
            'slug' => 'products.update',
        ]);
        $role = Role::query()->create([
            'name' => 'Product manager',
            'slug' => 'product-manager',
        ]);
        $role->permissions()->attach($permission);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        $product = Product::query()->create([
            'name' => 'Vanna',
            'slug' => 'vanna-currency-test',
            'sku' => 'VANNA-CURRENCY-TEST',
            'price' => 45000,
            'compare_at_price' => 50000,
            'currency' => 'USD',
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/admin/products/'.$product->id, [
                'currency' => 'KHR',
            ])
            ->assertOk()
            ->assertJsonPath('data.product.currency', 'KHR');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'currency' => 'KHR',
        ]);
    }
}
