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
                'media_url' => 'http://cdn.example.test/banner.jpg',
                'button_url' => 'http://example.test',
                'text_align' => 'justify',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['media_url', 'button_url', 'text_align']]);
    }

    public function test_banner_saves_uploaded_image_and_derives_media_type_from_the_url(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/banners', [
                ...$this->bannerAttributes('Uploaded image'),
                'media_url' => 'https://res.cloudinary.com/test-cloud/image/upload/banner.webp',
                'media_type' => 'video',
            ])
            ->assertCreated()
            ->assertJsonPath('data.banner.media_type', 'image')
            ->assertJsonPath('data.banner.media_url', 'https://res.cloudinary.com/test-cloud/image/upload/banner.webp');
    }

    public function test_banner_saves_image_and_video_links_with_type_derived_from_extension(): void
    {
        $admin = $this->userWithRole('admin');
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/banners', [
                ...$this->bannerAttributes('Image link'),
                'media_url' => 'https://cdn.example.test/banners/sale.jpg?width=1200',
                'button_url' => '/products',
                'media_type' => 'video',
            ])
            ->assertCreated()
            ->assertJsonPath('data.banner.media_type', 'image');

        $this->postJson('/api/v1/admin/banners', [
            ...$this->bannerAttributes('Video link'),
            'media_url' => 'https://cdn.example.test/banners/campaign.mp4?quality=auto',
            'media_type' => 'image',
        ])
            ->assertCreated()
            ->assertJsonPath('data.banner.media_type', 'video');
    }

    public function test_banner_media_type_is_derived_and_both_headlines_are_optional(): void
    {
        $admin = $this->userWithRole('admin');
        $payload = $this->bannerAttributes('Optional headlines', [
            'headline_km' => '',
            'headline_en' => '',
        ]);
        unset($payload['media_type']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/banners', [
                ...$payload,
                'media_url' => 'https://cdn.example.test/banners/no-headline.webp',
            ])
            ->assertCreated()
            ->assertJsonPath('data.banner.media_type', 'image')
            ->assertJsonPath('data.banner.headline_km', '')
            ->assertJsonPath('data.banner.headline_en', '');
    }

    public function test_banner_optional_empty_strings_are_stored_as_null(): void
    {
        $admin = $this->userWithRole('admin');
        $id = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/banners', [
                ...$this->bannerAttributes('Optional fields', [
                    'headline_km' => '',
                    'headline_en' => 'English headline',
                ]),
                'media_url' => 'https://cdn.example.test/banners/optional.webp',
                'mobile_media_url' => '',
                'poster_url' => '',
                'eyebrow_km' => '',
                'eyebrow_en' => '<b>New</b>',
                'subtitle_km' => '',
                'subtitle_en' => '',
                'button_text_km' => '',
                'button_text_en' => '',
                'button_url' => '',
                'starts_at' => '',
                'ends_at' => '',
            ])
            ->assertCreated()
            ->json('data.banner.id');

        $banner = SiteBanner::query()->findOrFail($id);
        foreach ([
            'mobile_media_url',
            'poster_url',
            'eyebrow_km',
            'subtitle_km',
            'subtitle_en',
            'button_text_km',
            'button_text_en',
            'button_url',
            'starts_at',
            'ends_at',
        ] as $field) {
            $this->assertNull($banner->{$field}, $field);
        }
        $this->assertSame('New', $banner->eyebrow_en);
        $this->assertSame('', $banner->headline_km);
    }

    public function test_banner_media_validation_rejects_bad_extensions_and_private_hosts(): void
    {
        $admin = $this->userWithRole('admin');
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/v1/admin/banners', [
            ...$this->bannerAttributes('Bad extension'),
            'media_url' => 'https://cdn.example.test/banner.gif',
        ])->assertUnprocessable()->assertJsonStructure(['errors' => ['media_url']]);

        foreach ([
            'https://127.0.0.1/banner.jpg',
            'https://10.1.2.3/banner.jpg',
            'https://172.31.0.4/banner.jpg',
            'https://192.168.1.8/banner.jpg',
            'https://169.254.5.6/banner.jpg',
            'https://[::1]/banner.jpg',
            'https://localhost/banner.jpg',
        ] as $url) {
            $this->postJson('/api/v1/admin/banners', [
                ...$this->bannerAttributes('Private host'),
                'media_url' => $url,
            ])->assertUnprocessable()->assertJsonStructure(['errors' => ['media_url']]);
        }
    }

    public function test_banner_schedule_must_not_end_before_start(): void
    {
        $admin = $this->userWithRole('admin');
        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/banners', [
            ...$this->bannerAttributes('Invalid schedule'),
            'starts_at' => '2026-11-27T00:00:00Z',
            'ends_at' => '2026-11-26T00:00:00Z',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['ends_at']]);
    }

    public function test_banner_requires_a_media_url(): void
    {
        $admin = $this->userWithRole('admin');
        $attributes = $this->bannerAttributes('Media is required');
        unset($attributes['media_url']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/banners', $attributes)
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['media_url']]);
    }

    public function test_banner_partial_update_cannot_schedule_end_before_existing_start(): void
    {
        $admin = $this->userWithRole('admin');
        $banner = SiteBanner::query()->create($this->bannerAttributes('Scheduled', [
            'starts_at' => now()->addDays(2),
        ]));

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/admin/banners/'.$banner->id, [
                'media_url' => $banner->media_url,
                'ends_at' => now()->addDay()->toAtomString(),
            ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['ends_at']]);
    }

    public function test_public_banner_cache_is_cleared_after_admin_save(): void
    {
        $banner = SiteBanner::query()->create($this->bannerAttributes('Before update'));
        $admin = $this->userWithRole('admin');

        $this->getJson('/api/v1/banners')
            ->assertJsonPath('data.banners.0.headline_en', 'Before update');

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/admin/banners/'.$banner->id, [
                'media_url' => $banner->media_url,
                'headline_en' => 'After update',
            ])
            ->assertOk();

        $this->getJson('/api/v1/banners')
            ->assertJsonPath('data.banners.0.headline_en', 'After update');
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

        $this->putJson('/api/v1/admin/banners/'.$first, [
            'media_url' => 'https://cdn.example.test/images/banner.jpg',
            'headline_en' => 'Updated first',
        ])
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
                'media_url' => 'https://cdn.example.test/images/banner.jpg',
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
