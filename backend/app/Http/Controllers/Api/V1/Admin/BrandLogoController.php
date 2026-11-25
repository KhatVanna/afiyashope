<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UploadBrandLogoRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use App\Services\CloudinaryService;
use App\Support\ApiResponse;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use RuntimeException;

class BrandLogoController extends Controller
{
    public function __construct(private readonly CloudinaryService $cloudinary) {}

    public function store(UploadBrandLogoRequest $request, Brand $brand): JsonResponse
    {
        $file = $request->file('logo');
        if (! $file instanceof UploadedFile) {
            throw new RuntimeException('The validated brand logo file is unavailable.');
        }

        $path = $file->getRealPath();
        if (! is_string($path)) {
            throw new RuntimeException('Unable to access the uploaded brand logo.');
        }

        $upload = $this->cloudinary->uploadLocalFile(
            $path,
            'brand-'.$brand->id.'-'.Str::uuid(),
            'afiya-shope/brands',
            overwrite: false,
        );

        if (blank($upload['secure_url'] ?? null) || blank($upload['public_id'] ?? null)) {
            throw new RuntimeException('Cloudinary returned incomplete brand logo metadata.');
        }

        $oldPublicId = $brand->logo_public_id;
        $brand->update([
            'logo_url' => $upload['secure_url'],
            'logo_public_id' => $upload['public_id'],
        ]);
        $brand->loadCount('products');

        if ($oldPublicId && $oldPublicId !== $upload['public_id'] && ! $this->cloudinary->destroy($oldPublicId)) {
            abort(502, 'The new logo was saved, but the previous Cloudinary file could not be deleted.');
        }

        CatalogCache::bust();

        return ApiResponse::success([
            'brand' => BrandResource::make($brand)->resolve(),
        ], 'Brand logo uploaded');
    }
}
