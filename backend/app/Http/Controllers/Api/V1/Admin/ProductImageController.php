<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Support\ApiResponse;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductImageController extends Controller
{
    private const MAX_IMAGES_PER_PRODUCT = 5;

    public function __construct(private readonly CloudinaryService $cloudinary) {}

    public function store(Request $request, Product $product): JsonResponse
    {
        $this->ensurePermission($request->user(), 'products.update');

        $data = $request->validate([
            'path' => ['nullable', 'required_without:url', 'string', 'max:2048'],
            'url' => ['nullable', 'required_without:path', 'url', 'max:2048'],
            'cloudinary_public_id' => ['nullable', 'string', 'max:255'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'is_primary' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);
        $path = $data['path'] ?? $data['url'];
        $url = $data['url'] ?? (filter_var($path, FILTER_VALIDATE_URL) ? $path : null);
        $publicId = $data['cloudinary_public_id']
            ?? ($url ? $this->cloudinary->extractPublicIdFromUrl($url) : null);

        $isPrimary = array_key_exists('is_primary', $data)
            ? (bool) $data['is_primary']
            : ! $product->images()->exists();

        $image = DB::transaction(function () use ($product, $data, $isPrimary, $path, $url, $publicId) {
            $lockedProduct = Product::query()->lockForUpdate()->findOrFail($product->id);
            if ($lockedProduct->images()->count() >= self::MAX_IMAGES_PER_PRODUCT) {
                throw ValidationException::withMessages([
                    'images' => 'A product can have up to 5 images.',
                ]);
            }

            if ($isPrimary) {
                $lockedProduct->images()->update(['is_primary' => false]);
            }

            return $lockedProduct->images()->create([
                'path' => $path,
                'url' => $url,
                'cloudinary_public_id' => $publicId,
                'alt_text' => $data['alt_text'] ?? null,
                'sort_order' => $data['sort_order'] ?? (($lockedProduct->images()->max('sort_order') ?? -1) + 1),
                'is_primary' => $isPrimary,
            ]);
        });

        $product->load(['category:id,name,slug', 'brand:id,name,slug', 'primaryImage', 'images']);

        CatalogCache::bust();

        return ApiResponse::success([
            'image' => [
                'id' => $image->id,
                'path' => $image->url ?: $image->path,
                'url' => $image->url ?: $image->path,
                'alt_text' => $image->alt_text,
                'is_primary' => $image->is_primary,
                'sort_order' => $image->sort_order,
            ],
            'product' => new ProductResource($product),
        ], 'Product image attached', 201);
    }

    public function destroy(Request $request, Product $product, ProductImage $image): JsonResponse
    {
        $this->ensurePermission($request->user(), 'products.update');

        if ($image->product_id !== $product->id) {
            abort(404);
        }

        $wasPrimary = $image->is_primary;
        $publicId = $image->cloudinary_public_id
            ?: $this->cloudinary->extractPublicIdFromUrl($image->url ?: $image->path);

        if ($publicId !== null && ! $this->cloudinary->destroy($publicId)) {
            abort(502, 'Cloudinary image deletion failed; the image was not deleted.');
        }

        $image->delete();

        if ($wasPrimary) {
            $next = $product->images()->orderBy('sort_order')->orderBy('id')->first();
            if ($next) {
                $next->update(['is_primary' => true]);
            }
        }

        $product->load(['category:id,name,slug', 'brand:id,name,slug', 'primaryImage', 'images']);

        CatalogCache::bust();

        return ApiResponse::success([
            'product' => new ProductResource($product),
        ], 'Product image deleted');
    }

    private function ensurePermission(?User $user, string $permission): void
    {
        if (! $user || ! $user->hasPermission($permission)) {
            abort(403, 'You do not have permission to perform this action.');
        }
    }
}
