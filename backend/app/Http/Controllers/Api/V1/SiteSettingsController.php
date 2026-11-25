<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateBrandingSettingsRequest;
use App\Http\Requests\Api\V1\Admin\UpdateContactSettingsRequest;
use App\Http\Requests\Api\V1\Admin\UpdateFooterSettingsRequest;
use App\Http\Requests\Api\V1\Admin\UpdateSeoSettingsRequest;
use App\Models\AdminActivityLog;
use App\Models\SiteSetting;
use App\Models\User;
use App\Support\ApiResponse;
use App\Support\SiteContentCache;
use App\Support\SiteSettingsDefaults;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SiteSettingsController extends Controller
{
    private const PUBLIC_TTL_SECONDS = 60;

    public function publicIndex(): JsonResponse
    {
        $groups = Cache::remember(
            SiteContentCache::SETTINGS_KEY,
            now()->addSeconds(self::PUBLIC_TTL_SECONDS),
            function (): array {
                $stored = SiteSetting::query()->get()->keyBy('group');
                $groups = [];

                foreach (SiteSettingsDefaults::groups() as $group => $defaults) {
                    $groups[$group] = array_replace($defaults, $stored->get($group)?->data ?? []);
                }

                return $groups;
            },
        );

        return ApiResponse::success($groups, 'Site settings retrieved');
    }

    public function showGroup(Request $request, string $group): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin($request->user())) {
            return $denied;
        }

        $defaults = SiteSettingsDefaults::groups()[$group] ?? null;
        if ($defaults === null) {
            return ApiResponse::error('Unknown site settings group.', 404);
        }

        $data = array_replace(
            $defaults,
            SiteSetting::query()->where('group', $group)->first()?->data ?? [],
        );

        return ApiResponse::success(['group' => $group, 'data' => $data], 'Site settings retrieved');
    }

    public function updateBranding(UpdateBrandingSettingsRequest $request): JsonResponse
    {
        return $this->saveGroup($request, 'branding');
    }

    public function updateContact(UpdateContactSettingsRequest $request): JsonResponse
    {
        return $this->saveGroup($request, 'contact');
    }

    public function updateFooter(UpdateFooterSettingsRequest $request): JsonResponse
    {
        return $this->saveGroup($request, 'footer');
    }

    public function updateSeo(UpdateSeoSettingsRequest $request): JsonResponse
    {
        return $this->saveGroup($request, 'seo');
    }

    private function saveGroup(FormRequest $request, string $group): JsonResponse
    {
        $defaults = SiteSettingsDefaults::groups()[$group];
        $record = SiteSetting::query()->firstOrNew(['group' => $group]);
        $updated = array_intersect_key($request->validated('data'), $defaults);
        $record->data = array_replace($defaults, $record->data ?? [], $updated);
        $record->updated_by = $request->user()->id;
        $record->save();

        AdminActivityLog::query()->create([
            'user_id' => $request->user()->id,
            'action' => 'site_settings.updated',
            'subject_type' => 'site_setting',
            'subject_id' => $record->id,
            'properties' => ['group' => $group],
            'ip_address' => $request->ip(),
        ]);

        SiteContentCache::clear();

        return ApiResponse::success(
            ['group' => $group, 'data' => $record->data],
            'Site settings updated',
        );
    }

    private function denyUnlessAdmin(?User $user): ?JsonResponse
    {
        if (! $user || ! $user->hasAnyRole(['admin', 'super-admin'])) {
            return ApiResponse::error('You do not have permission to manage site settings.', 403);
        }

        return null;
    }
}
