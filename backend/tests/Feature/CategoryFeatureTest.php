<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class CategoryFeatureTest extends TestCase
{
    use DatabaseMigrations;

    public function test_featured_style_categories_exist_with_bilingual_names_and_no_product_assignments(): void
    {
        $categories = [
            ['name' => 'Pastel Colors', 'name_km' => 'ពណ៌ប៉ាស្តែល', 'slug' => 'pastel-colors'],
            ['name' => 'Luxury Styles', 'name_km' => 'ម៉ូដប្រណិត', 'slug' => 'luxury-styles'],
            ['name' => 'Matching Sets', 'name_km' => 'ឈុតពេញ', 'slug' => 'matching-sets'],
        ];

        foreach ($categories as $attributes) {
            $this->assertDatabaseHas('categories', $attributes + ['is_active' => true]);
            $this->assertSame(
                0,
                Category::query()->where('slug', $attributes['slug'])->firstOrFail()->products()->count()
            );
        }

        $this->getJson('/api/v1/catalog/categories')
            ->assertOk()
            ->assertJsonCount(3, 'data.items')
            ->assertJsonFragment(['name' => 'Pastel Colors', 'name_km' => 'ពណ៌ប៉ាស្តែល'])
            ->assertJsonFragment(['name' => 'Luxury Styles', 'name_km' => 'ម៉ូដប្រណិត'])
            ->assertJsonFragment(['name' => 'Matching Sets', 'name_km' => 'ឈុតពេញ']);
    }

    public function test_admin_can_list_create_and_update_bilingual_category_names_without_changing_products(): void
    {
        $admin = $this->userWithRole('admin');
        $category = Category::query()->create([
            'name' => 'Original English',
            'name_km' => 'ឈ្មោះដើម',
            'slug' => 'original-english',
        ]);
        $product = Product::query()->create([
            'category_id' => $category->id,
            'name' => 'Existing product',
            'slug' => 'existing-product',
            'sku' => 'EXISTING-PRODUCT',
            'price' => 12.50,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/categories')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Original English')
            ->assertJsonPath('data.items.0.name_km', 'ឈ្មោះដើម')
            ->assertJsonPath('data.items.0.product_count', 1);

        $categoryId = $this->postJson('/api/v1/admin/categories', [
            'name' => 'Pastel Abayas',
            'name_km' => 'អាបាយ៉ាពណ៌ប៉ាស្តែល',
        ])
            ->assertCreated()
            ->assertJsonPath('data.category.slug', 'pastel-abayas')
            ->assertJsonPath('data.category.name_km', 'អាបាយ៉ាពណ៌ប៉ាស្តែល')
            ->json('data.category.id');

        $this->putJson('/api/v1/admin/categories/'.$category->id, [
            'name' => 'Updated English',
            'name_km' => 'ឈ្មោះថ្មី',
        ])
            ->assertOk()
            ->assertJsonPath('data.category.name', 'Updated English')
            ->assertJsonPath('data.category.name_km', 'ឈ្មោះថ្មី');

        $this->assertDatabaseHas('categories', [
            'id' => $categoryId,
            'name' => 'Pastel Abayas',
            'name_km' => 'អាបាយ៉ាពណ៌ប៉ាស្តែល',
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'category_id' => $category->id,
            'name' => 'Existing product',
            'sku' => 'EXISTING-PRODUCT',
        ]);
    }

    public function test_admin_can_delete_a_category_and_uncategorize_active_and_soft_deleted_products(): void
    {
        $admin = $this->userWithRole('admin');
        $category = Category::query()->create([
            'name' => 'Used category',
            'name_km' => 'ប្រភេទមានផលិតផល',
            'slug' => 'used-category',
        ]);
        $activeProduct = Product::query()->create($this->productAttributes(
            $category->id,
            'active-category-product',
        ));
        $deletedProduct = Product::query()->create($this->productAttributes(
            $category->id,
            'deleted-category-product',
        ));
        $deletedProduct->delete();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/categories/'.$category->id)
            ->assertOk();

        $this->assertSoftDeleted('categories', ['id' => $category->id]);
        $this->assertDatabaseHas('products', [
            'id' => $activeProduct->id,
            'category_id' => null,
            'name' => 'Product active-category-product',
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $deletedProduct->id,
            'category_id' => null,
            'name' => 'Product deleted-category-product',
        ]);
        $this->assertSoftDeleted('products', ['id' => $deletedProduct->id]);

        $permission = Permission::query()->create([
            'name' => 'View Products',
            'slug' => 'products.view',
            'group' => 'products',
        ]);
        $admin->roles()->firstOrFail()->permissions()->attach($permission);

        $this->getJson('/api/v1/admin/products?category_id=uncategorized')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.category_id', null)
            ->assertJsonPath('data.items.0.category', null);

        $this->getJson('/api/v1/catalog/products?per_page=50')
            ->assertOk()
            ->assertJsonPath('data.items.0.category_id', null)
            ->assertJsonPath('data.items.0.category', null);

        $this->getJson('/api/v1/catalog/products/'.$activeProduct->slug)
            ->assertOk()
            ->assertJsonPath('data.product.category_id', null)
            ->assertJsonPath('data.product.category', null);
    }

    public function test_admin_can_delete_an_unused_category(): void
    {
        $admin = $this->userWithRole('admin');
        $category = Category::query()->create([
            'name' => 'Unused category',
            'name_km' => 'ប្រភេទមិនទាន់ប្រើ',
            'slug' => 'unused-category',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/categories/'.$category->id)
            ->assertOk();

        $this->assertSoftDeleted('categories', ['id' => $category->id]);
    }

    public function test_staff_cannot_manage_categories(): void
    {
        $staff = $this->userWithRole('staff');

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/categories')
            ->assertForbidden();

        $this->postJson('/api/v1/admin/categories', [
            'name' => 'Restricted category',
            'name_km' => 'ប្រភេទមានកម្រិត',
        ])->assertForbidden();
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
    private function productAttributes(int $categoryId, string $suffix): array
    {
        return [
            'category_id' => $categoryId,
            'name' => 'Product '.$suffix,
            'slug' => $suffix,
            'sku' => strtoupper($suffix),
            'price' => 10,
        ];
    }
}
