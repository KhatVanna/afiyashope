<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Mockery;
use Tests\TestCase;

class BrandFeatureTest extends TestCase
{
    use DatabaseMigrations;

    public function test_brand_management_is_owner_only_and_supports_create_update_and_unique_slugs(): void
    {
        $admin = $this->userWithRole('admin');
        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/brands')
            ->assertForbidden();

        $owner = $this->userWithRole('super-admin');
        Brand::query()->create([
            'name' => 'Existing label',
            'slug' => 'new-label',
        ]);

        $brandId = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/admin/brands', [
                'name' => 'New Label',
                'description' => 'A sample brand',
                'is_active' => true,
                'sort_order' => 3,
            ])
            ->assertCreated()
            ->assertJsonPath('data.brand.slug', 'new-label-1')
            ->json('data.brand.id');

        $this->putJson('/api/v1/admin/brands/'.$brandId, [
            'name' => 'Updated Label',
            'is_active' => false,
            'sort_order' => 7,
        ])
            ->assertOk()
            ->assertJsonPath('data.brand.name', 'Updated Label')
            ->assertJsonPath('data.brand.is_active', false)
            ->assertJsonPath('data.brand.sort_order', 7);

        $this->postJson('/api/v1/admin/brands', ['name' => 'Updated Label'])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['name']]);
    }

    public function test_public_brand_list_and_product_filter_only_include_active_brands(): void
    {
        $active = Brand::query()->create([
            'name' => 'Active Label',
            'slug' => 'active-label',
            'is_active' => true,
        ]);
        $inactive = Brand::query()->create([
            'name' => 'Inactive Label',
            'slug' => 'inactive-label',
            'is_active' => false,
        ]);
        Product::query()->create($this->productAttributes($active->id, 'active-product'));
        Product::query()->create($this->productAttributes($inactive->id, 'inactive-product'));

        $this->getJson('/api/v1/catalog/brands')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.slug', 'active-label')
            ->assertJsonPath('data.items.0.product_count', 1);

        $this->getJson('/api/v1/catalog/products?brand=active-label')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.brand.name', 'Active Label');

        $this->getJson('/api/v1/catalog/products?brand=inactive-label')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);
    }

    public function test_deleting_a_brand_detaches_active_and_soft_deleted_products(): void
    {
        $owner = $this->userWithRole('super-admin');
        $brand = Brand::query()->create([
            'name' => 'Delete Label',
            'slug' => 'delete-label',
            'logo_public_id' => 'afiya-shope/brands/delete-label',
        ]);
        $activeProduct = Product::query()->create($this->productAttributes($brand->id, 'delete-active'));
        $deletedProduct = Product::query()->create($this->productAttributes($brand->id, 'delete-trashed'));
        $deletedProduct->delete();

        $cloudinary = Mockery::mock(CloudinaryService::class);
        $cloudinary->shouldReceive('destroy')
            ->once()
            ->with('afiya-shope/brands/delete-label')
            ->andReturnTrue();
        $this->app->instance(CloudinaryService::class, $cloudinary);

        $this->actingAs($owner, 'sanctum')
            ->deleteJson('/api/v1/admin/brands/'.$brand->id)
            ->assertOk();

        $this->assertSoftDeleted('brands', ['id' => $brand->id]);
        $this->assertDatabaseHas('products', ['id' => $activeProduct->id, 'brand_id' => null]);
        $this->assertDatabaseHas('products', ['id' => $deletedProduct->id, 'brand_id' => null]);
        $this->assertSoftDeleted('products', ['id' => $deletedProduct->id]);
    }

    public function test_logo_upload_validates_image_size_and_replaces_the_old_asset(): void
    {
        $owner = $this->userWithRole('super-admin');
        $brand = Brand::query()->create([
            'name' => 'Logo Label',
            'slug' => 'logo-label',
            'logo_public_id' => 'old-logo',
        ]);
        $cloudinary = Mockery::mock(CloudinaryService::class);
        $cloudinary->shouldReceive('uploadLocalFile')
            ->once()
            ->withArgs(fn (string $path, string $publicId, string $folder, bool $overwrite) => is_file($path)
                && str_starts_with($publicId, 'brand-'.$brand->id.'-')
                && $folder === 'afiya-shope/brands'
                && $overwrite === false
            )
            ->andReturn([
                'secure_url' => 'https://res.cloudinary.com/test/brand-logo.webp',
                'public_id' => 'afiya-shope/brands/new-logo',
            ]);
        $cloudinary->shouldReceive('destroy')->once()->with('old-logo')->andReturnTrue();
        $this->app->instance(CloudinaryService::class, $cloudinary);

        $this->actingAs($owner, 'sanctum');
        $this->postJson('/api/v1/admin/brands/'.$brand->id.'/logo', [
            'logo' => UploadedFile::fake()->create('invalid.pdf', 10, 'application/pdf'),
        ])->assertUnprocessable();
        $this->postJson('/api/v1/admin/brands/'.$brand->id.'/logo', [
            'logo' => UploadedFile::fake()->image('large.jpg')->size(2049),
        ])->assertUnprocessable();

        $this->postJson('/api/v1/admin/brands/'.$brand->id.'/logo', [
            'logo' => UploadedFile::fake()->image('logo.jpg'),
        ])
            ->assertOk()
            ->assertJsonPath('data.brand.logo_url', 'https://res.cloudinary.com/test/brand-logo.webp');

        $this->assertDatabaseHas('brands', [
            'id' => $brand->id,
            'logo_url' => 'https://res.cloudinary.com/test/brand-logo.webp',
            'logo_public_id' => 'afiya-shope/brands/new-logo',
        ]);
    }

    private function userWithRole(string $slug): User
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => $slug],
            ['name' => ucfirst($slug), 'description' => 'Test role'],
        );
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function productAttributes(int $brandId, string $suffix): array
    {
        return [
            'brand_id' => $brandId,
            'name' => 'Product '.$suffix,
            'slug' => $suffix,
            'sku' => strtoupper($suffix),
            'price' => 10,
        ];
    }
}
