<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreSiteMediaRequest;
use App\Models\AdminActivityLog;
use App\Services\CloudinaryService;
use App\Support\ApiResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use RuntimeException;

class SiteMediaController extends Controller
{
    public function __construct(private readonly CloudinaryService $cloudinary) {}

    public function store(StoreSiteMediaRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $path = $file?->getRealPath();
        if (! is_string($path) || $path === '') {
            return ApiResponse::error('Unable to read the uploaded media file.', 422);
        }

        $kind = $request->validated('kind');
        $resourceType = $kind === 'banner_video' ? 'video' : 'image';

        try {
            $asset = $this->cloudinary->uploadLocalFile(
                absolutePath: $path,
                publicId: Str::lower($kind).'-'.Str::uuid(),
                folder: 'afiya/site-settings',
                overwrite: false,
                resourceType: $resourceType,
            );
        } catch (RuntimeException) {
            return ApiResponse::error('The site media upload failed. Check the media service configuration.', 502);
        } catch (ConnectionException) {
            return ApiResponse::error('The site media upload failed.', 502);
        }

        AdminActivityLog::query()->create([
            'user_id' => $request->user()->id,
            'action' => 'site_media.uploaded',
            'subject_type' => 'site_media',
            'properties' => ['kind' => $kind],
            'ip_address' => $request->ip(),
        ]);

        return ApiResponse::success([
            'url' => $asset['secure_url'],
            'public_id' => $asset['public_id'],
            'kind' => $kind,
        ], 'Site media uploaded', 201);
    }
}
