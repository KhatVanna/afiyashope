<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ReorderSiteBannersRequest;
use App\Http\Requests\Api\V1\Admin\StoreSiteBannerRequest;
use App\Http\Requests\Api\V1\Admin\UpdateSiteBannerRequest;
use App\Models\AdminActivityLog;
use App\Models\SiteBanner;
use App\Models\User;
use App\Support\ApiResponse;
use App\Support\SiteBannerMedia;
use App\Support\SiteContentCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SiteBannerController extends Controller
{
    private const PUBLIC_TTL_SECONDS = 60;

    public function publicIndex(): JsonResponse
    {
        $banners = Cache::remember(
            SiteContentCache::BANNERS_KEY,
            now()->addSeconds(self::PUBLIC_TTL_SECONDS),
            fn () => SiteBanner::query()
                ->where('is_active', true)
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (SiteBanner $banner) => $banner->toPublicArray())
                ->all(),
        );

        return ApiResponse::success(['banners' => $banners], 'Banners retrieved');
    }

    public function index(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin($request->user())) {
            return $denied;
        }

        return ApiResponse::success([
            'banners' => SiteBanner::query()->orderBy('sort_order')->orderBy('id')->get(),
        ], 'Banners retrieved');
    }

    public function store(StoreSiteBannerRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['media_type'] = SiteBannerMedia::typeFromUrl($data['media_url']);
        $data['headline_km'] = $data['headline_km'] ?? '';
        $data['headline_en'] = $data['headline_en'] ?? '';
        $banner = SiteBanner::query()->create($data);
        $this->logChange($request, 'site_banner.created', $banner);
        SiteContentCache::clear();

        return ApiResponse::success(['banner' => $banner], 'Banner created', 201);
    }

    public function update(UpdateSiteBannerRequest $request, SiteBanner $banner): JsonResponse
    {
        $data = $request->validated();
        $mediaUrl = $data['media_url'] ?? $banner->media_url;
        $data['media_type'] = SiteBannerMedia::typeFromUrl($mediaUrl) ?? $banner->media_type;
        $data['headline_km'] = array_key_exists('headline_km', $data)
            ? ($data['headline_km'] ?? '')
            : $banner->headline_km;
        $data['headline_en'] = array_key_exists('headline_en', $data)
            ? ($data['headline_en'] ?? '')
            : $banner->headline_en;
        $banner->fill($data);
        $banner->save();
        $this->logChange($request, 'site_banner.updated', $banner);
        SiteContentCache::clear();

        return ApiResponse::success(['banner' => $banner], 'Banner updated');
    }

    public function destroy(Request $request, SiteBanner $banner): JsonResponse
    {
        if ($denied = $this->denyUnlessAdmin($request->user())) {
            return $denied;
        }

        $bannerId = $banner->id;
        $banner->delete();
        $this->logChange($request, 'site_banner.deleted', $bannerId);
        SiteContentCache::clear();

        return ApiResponse::success(null, 'Banner deleted');
    }

    public function reorder(ReorderSiteBannersRequest $request): JsonResponse
    {
        $ids = $request->validated('ids');

        DB::transaction(function () use ($ids): void {
            foreach ($ids as $sortOrder => $id) {
                SiteBanner::query()->whereKey($id)->update(['sort_order' => $sortOrder]);
            }
        });

        $this->logChange($request, 'site_banner.reordered', null);
        SiteContentCache::clear();

        return ApiResponse::success([
            'banners' => SiteBanner::query()->orderBy('sort_order')->orderBy('id')->get(),
        ], 'Banners reordered');
    }

    private function denyUnlessAdmin(?User $user): ?JsonResponse
    {
        if (! $user || ! $user->hasAnyRole(['admin', 'super-admin'])) {
            return ApiResponse::error('You do not have permission to manage site banners.', 403);
        }

        return null;
    }

    private function logChange(Request $request, string $action, SiteBanner|int|null $banner): void
    {
        AdminActivityLog::query()->create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => 'site_banner',
            'subject_id' => $banner instanceof SiteBanner ? $banner->id : $banner,
            'properties' => [],
            'ip_address' => $request->ip(),
        ]);
    }
}
