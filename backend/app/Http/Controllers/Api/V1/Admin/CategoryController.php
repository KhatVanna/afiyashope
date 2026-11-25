<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Admin\UpdateCategoryRequest;
use App\Http\Resources\AdminCategoryResource;
use App\Models\Category;
use App\Models\Product;
use App\Support\ApiResponse;
use App\Support\CatalogCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Category::class);

        $categories = Category::query()
            ->withCount(['products' => static fn (Builder $query) => $query->withTrashed()])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return ApiResponse::success([
            'items' => AdminCategoryResource::collection($categories)->resolve(),
        ], 'Categories retrieved');
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['name']);

        $category = Category::query()->create($data);
        CatalogCache::bust();

        return ApiResponse::success([
            'category' => AdminCategoryResource::make($category)->resolve(),
        ], 'Category created', 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());
        $category->loadCount(['products' => static fn (Builder $query) => $query->withTrashed()]);
        CatalogCache::bust();

        return ApiResponse::success([
            'category' => AdminCategoryResource::make($category)->resolve(),
        ], 'Category updated');
    }

    public function destroy(Category $category): JsonResponse
    {
        Gate::authorize('delete', $category);

        DB::transaction(function () use ($category): void {
            Product::withTrashed()
                ->where('category_id', $category->id)
                ->update(['category_id' => null]);

            $category->delete();
        });
        CatalogCache::bust();

        return ApiResponse::success(null, 'Category deleted');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $counter = 1;

        while (Category::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
