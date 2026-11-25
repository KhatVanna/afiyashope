<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreBrandRequest;
use App\Http\Requests\Api\V1\Admin\UpdateBrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use App\Models\Product;
use App\Services\CloudinaryService;
use App\Support\ApiResponse;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function __construct(private readonly CloudinaryService $cloudinary) {}

    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Brand::class);

        $brands = Brand::query()
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return ApiResponse::success([
            'items' => BrandResource::collection($brands)->resolve(),
        ], 'Brands retrieved');
    }

    public function store(StoreBrandRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['name']);

        $brand = Brand::query()->create($data);
        CatalogCache::bust();

        return ApiResponse::success([
            'brand' => BrandResource::make($brand)->resolve(),
        ], 'Brand created', 201);
    }

    public function update(UpdateBrandRequest $request, Brand $brand): JsonResponse
    {
        $brand->update($request->validated());
        $brand->loadCount('products');
        CatalogCache::bust();

        return ApiResponse::success([
            'brand' => BrandResource::make($brand)->resolve(),
        ], 'Brand updated');
    }

    public function destroy(Brand $brand): JsonResponse
    {
        Gate::authorize('delete', $brand);

        if ($brand->logo_public_id && ! $this->cloudinary->destroy($brand->logo_public_id)) {
            abort(502, 'Cloudinary logo deletion failed; the brand was not deleted.');
        }

        DB::transaction(function () use ($brand): void {
            Product::withTrashed()
                ->where('brand_id', $brand->id)
                ->update(['brand_id' => null]);

            $brand->delete();
        });

        CatalogCache::bust();

        return ApiResponse::success(null, 'Brand deleted');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'brand';
        $slug = $base;
        $counter = 1;

        while (Brand::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
