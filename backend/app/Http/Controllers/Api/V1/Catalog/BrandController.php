<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Support\ApiResponse;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class BrandController extends Controller
{
    private const TTL = 600;

    public function index(): JsonResponse
    {
        $items = Cache::remember(CatalogCache::key('brands'), self::TTL, function () {
            return CatalogCache::serialize([
                'items' => Brand::query()
                    ->where('is_active', true)
                    ->withCount(['products' => fn ($query) => $query->where('is_active', true)])
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'slug', 'logo_url', 'description', 'sort_order'])
                    ->map(fn (Brand $brand) => [
                        'id' => $brand->id,
                        'name' => $brand->name,
                        'slug' => $brand->slug,
                        'logo_url' => $brand->logo_url,
                        'description' => $brand->description,
                        'product_count' => (int) $brand->products_count,
                    ])
                    ->values()
                    ->all(),
            ])['items'];
        });

        return ApiResponse::success(['items' => $items], 'Brands retrieved');
    }
}
