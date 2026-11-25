<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class ProductImageLimitFeatureTest extends TestCase
{
    use DatabaseMigrations;

    public function test_admin_can_attach_up_to_five_images_per_product(): void
    {
        $permissions = collect(['products.update', 'products.view'])
            ->map(fn (string $slug) => Permission::query()->create([
                'name' => $slug,
                'slug' => $slug,
            ]));
        $role = Role::query()->create([
            'name' => 'Product manager',
            'slug' => 'product-manager',
        ]);
        $role->permissions()->attach($permissions->pluck('id')->all());
        $user = User::factory()->create();
        $user->roles()->attach($role);

        $product = Product::query()->create([
            'name' => 'Gallery product',
            'slug' => 'gallery-product',
            'sku' => 'GALLERY-PRODUCT',
            'price' => 50,
        ]);

        $this->actingAs($user, 'sanctum');

        for ($number = 1; $number <= 5; $number++) {
            $this->postJson('/api/v1/admin/products/'.$product->id.'/images', [
                'path' => "/images/products/gallery-{$number}.jpg",
            ])->assertCreated();
        }

        $this->postJson('/api/v1/admin/products/'.$product->id.'/images', [
            'path' => '/images/products/gallery-6.jpg',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('images');

        $this->getJson('/api/v1/admin/products/'.$product->id)
            ->assertOk()
            ->assertJsonCount(5, 'data.product.images');
        $this->assertDatabaseCount('product_images', 5);
        $this->assertSame(
            1,
            ProductImage::query()
                ->where('product_id', $product->id)
                ->where('is_primary', true)
                ->count()
        );
    }
}
