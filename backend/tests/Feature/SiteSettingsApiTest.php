<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\SiteBanner;
use App\Models\SiteSetting;
use App\Models\User;
use App\Support\SiteSettingsDefaults;
use Database\Seeders\SiteSettingsSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SiteSettingsApiTest extends TestCase
{
    use DatabaseMigrations;

    public function test_public_endpoints_return_default_settings_and_only_active_in_window_banners(): void
    {
        SiteBanner::query()->create($this->bannerAttributes('Current banner'));
        SiteBanner::query()->create($this->bannerAttributes('Inactive banner', ['is_active' => false]));
        SiteBanner::query()->create($this->bannerAttributes('Future banner', ['starts_at' => now()->addDay()]));
        SiteBanner::query()->create($this->bannerAttributes('Expired banner', ['ends_at' => now()->subDay()]));

        $this->getJson('/api/v1/site-settings')
            ->assertOk()
            ->assertJsonPath('data.branding.primary_color', '#21A8D8')
            ->assertJsonPath('data.seo.site_title_en', 'Afiya Shope | Luxury Abaya Boutique');

        $this->getJson('/api/v1/banners')
            ->assertOk()
            ->assertJsonCount(1, 'data.banners')
            ->assertJsonPath('data.banners.0.headline_en', 'Current banner')
            ->assertJsonMissingPath('data.banners.0.updated_by')
            ->assertJsonMissingPath('data.banners.0.is_active');
    }

    public function test_admin_routes_reject_guests_and_non_admin_roles(): void
    {
        $this->getJson('/api/v1/admin/site-settings/branding')->assertUnauthorized();
        $this->getJson('/api/v1/admin/banners')->assertUnauthorized();

        $staff = $this->userWithRole('staff');
        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/site-settings/branding')
            ->assertForbidden();
        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/banners/reorder', ['ids' => [1]])
            ->assertForbidden();
    }

    public function test_settings_validation_sanitization_cache_invalidation_and_audit_logging(): void
    {
        $admin = $this->userWithRole('admin');
        $this->getJson('/api/v1/site-settings')
            ->assertJsonPath('data.branding.primary_color', '#21A8D8');

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/admin/site-settings/branding', [
                'data' => [
                    'primary_color' => 'blue',
                    'logo_light' => 'http://example.test/logo.png',
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['success', 'message', 'errors']);

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/admin/site-settings/branding', [
                'data' => [
                    'primary_color' => '#123456',
                    'logo_light' => '/images/<b>brand.png</b>',
                    'unknown_secret_like_field' => 'must not be persisted',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.data.logo_light', '/images/brand.png');

        $setting = SiteSetting::query()->where('group', 'branding')->firstOrFail();
        $this->assertSame('#123456', $setting->data['primary_color']);
        $this->assertArrayNotHasKey('unknown_secret_like_field', $setting->data);
        $this->assertSame($admin->id, $setting->updated_by);
        $this->assertDatabaseHas('admin_activity_logs', [
            'user_id' => $admin->id,
            'action' => 'site_settings.updated',
            'subject_id' => $setting->id,
            'properties' => json_encode(['group' => 'branding']),
        ]);

        $this->getJson('/api/v1/site-settings')
            ->assertJsonPath('data.branding.primary_color', '#123456');
    }

    public function test_banner_validation_rejects_non_https_urls_and_invalid_alignment(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/banners', [
                ...$this->bannerAttributes('Unsafe banner'),
                'media_url' => 'javascript:alert(1)',
                'button_url' => 'http://example.test',
                'text_align' => 'justify',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['media_url', 'button_url', 'text_align']]);
    }

    public function test_banner_partial_update_cannot_schedule_end_before_existing_start(): void
    {
        $admin = $this->userWithRole('admin');
        $banner = SiteBanner::query()->create($this->bannerAttributes('Scheduled', [
            'starts_at' => now()->addDays(2),
        ]));

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/admin/banners/'.$banner->id, [
                'ends_at' => now()->addDay()->toAtomString(),
            ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['ends_at']]);
    }

    public function test_admin_can_create_update_reorder_and_delete_banners(): void
    {
        $admin = $this->userWithRole('super-admin');

        $first = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/banners', $this->bannerAttributes('First'))
            ->assertCreated()
            ->json('data.banner.id');
        $second = $this->postJson('/api/v1/admin/banners', $this->bannerAttributes('Second'))
            ->assertCreated()
            ->json('data.banner.id');

        $this->putJson('/api/v1/admin/banners/'.$first, ['headline_en' => 'Updated first'])
            ->assertOk()
            ->assertJsonPath('data.banner.headline_en', 'Updated first');

        $this->postJson('/api/v1/admin/banners/reorder', ['ids' => [$second, $first]])
            ->assertOk()
            ->assertJsonPath('data.banners.0.id', $second)
            ->assertJsonPath('data.banners.0.sort_order', 0)
            ->assertJsonPath('data.banners.1.sort_order', 1);

        $this->deleteJson('/api/v1/admin/banners/'.$first)->assertOk();
        $this->assertDatabaseMissing('site_banners', ['id' => $first]);
    }

    public function test_site_media_validation_rejects_invalid_and_oversized_files_and_upload_uses_configured_cloudinary_service(): void
    {
        $admin = $this->userWithRole('admin');
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/v1/admin/media/site-settings', [
            'kind' => 'banner_image',
            'file' => UploadedFile::fake()->create('payload.pdf', 10, 'application/pdf'),
        ])->assertUnprocessable();

        $this->postJson('/api/v1/admin/media/site-settings', [
            'kind' => 'banner_image',
            'file' => UploadedFile::fake()->create('large.jpg', 5121, 'image/jpeg'),
        ])->assertUnprocessable();

        $this->postJson('/api/v1/admin/media/site-settings', [
            'kind' => 'banner_video',
            'file' => UploadedFile::fake()->create('large.mp4', 15361, 'video/mp4'),
        ])->assertUnprocessable();

        config([
            'services.cloudinary.cloud_name' => 'test-cloud',
            'services.cloudinary.api_key' => 'test-key',
            'services.cloudinary.api_secret' => 'test-secret',
        ]);
        Http::fake([
            'https://api.cloudinary.com/*' => Http::response([
                'secure_url' => 'https://res.cloudinary.com/test-cloud/image/upload/logo.png',
                'public_id' => 'site-settings/logo-test',
            ], 200),
        ]);

        $this->postJson('/api/v1/admin/media/site-settings', [
            'kind' => 'logo',
            'file' => UploadedFile::fake()->image('logo.jpg'),
        ])
            ->assertCreated()
            ->assertJsonPath('data.kind', 'logo')
            ->assertJsonPath('data.url', 'https://res.cloudinary.com/test-cloud/image/upload/logo.png');

        Http::assertSent(fn ($request) => str_contains($request->url(), '/image/upload'));
    }

    public function test_site_settings_seeder_is_idempotent_and_does_not_replace_saved_values(): void
    {
        $this->seed(SiteSettingsSeeder::class);
        SiteSetting::query()->where('group', 'branding')->update([
            'data' => ['primary_color' => '#654321'],
        ]);
        $this->seed(SiteSettingsSeeder::class);

        $this->assertSame(
            '#654321',
            SiteSetting::query()->where('group', 'branding')->firstOrFail()->data['primary_color'],
        );
        $this->assertSame(count(SiteSettingsDefaults::groups()), SiteSetting::query()->count());
        $this->assertSame(1, SiteBanner::query()->count());
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function bannerAttributes(string $headline, array $overrides = []): array
    {
        return array_replace(
            SiteSettingsDefaults::defaultBanner(),
            [
                'media_type' => 'image',
                'media_url' => '/images/banner.jpg',
                'headline_en' => $headline,
                'headline_km' => 'ម៉ូដថ្មី',
                'sort_order' => 1,
            ],
            $overrides,
        );
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
}
