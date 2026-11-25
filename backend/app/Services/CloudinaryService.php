<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class CloudinaryService
{
    public function cloudName(): string
    {
        return (string) config('services.cloudinary.cloud_name');
    }

    public function apiKey(): string
    {
        return (string) config('services.cloudinary.api_key');
    }

    public function folder(): string
    {
        return (string) config('services.cloudinary.folder', 'v2005/products');
    }

    /**
     * @return array{cloud_name: string, api_key: string, timestamp: int, folder: string, signature: string, upload_url: string}
     */
    public function signedUploadParams(?string $folder = null): array
    {
        $this->assertConfigured();

        $timestamp = time();
        $folder = $folder ?: $this->folder();

        $params = [
            'folder' => $folder,
            'timestamp' => $timestamp,
        ];

        return [
            'cloud_name' => $this->cloudName(),
            'api_key' => $this->apiKey(),
            'timestamp' => $timestamp,
            'folder' => $folder,
            'signature' => $this->sign($params),
            'upload_url' => sprintf(
                'https://api.cloudinary.com/v1_1/%s/image/upload',
                $this->cloudName()
            ),
        ];
    }

    /**
     * Upload a local image file and return Cloudinary metadata.
     *
     * @return array{secure_url: string, public_id: string}
     */
    public function uploadLocalFile(
        string $absolutePath,
        string $publicId,
        ?string $folder = null,
        bool $overwrite = true,
        string $resourceType = 'image',
    ): array {
        $this->assertConfigured();

        if (! in_array($resourceType, ['image', 'video'], true)) {
            throw new RuntimeException('Unsupported Cloudinary resource type.');
        }

        if (! is_file($absolutePath)) {
            throw new RuntimeException('Cloudinary upload source is missing.');
        }

        $fileContents = file_get_contents($absolutePath);
        if ($fileContents === false) {
            throw new RuntimeException('Unable to read the Cloudinary upload source.');
        }

        $timestamp = time();
        $folder = $folder ?: $this->folder();
        $params = [
            'folder' => $folder,
            'overwrite' => $overwrite ? 'true' : 'false',
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ];

        $response = Http::withOptions($this->httpOptions())
            ->asMultipart()
            ->attach('file', $fileContents, basename($absolutePath))
            ->post(
                sprintf('https://api.cloudinary.com/v1_1/%s/%s/upload', $this->cloudName(), $resourceType),
                [
                    ['name' => 'api_key', 'contents' => $this->apiKey()],
                    ['name' => 'timestamp', 'contents' => (string) $timestamp],
                    ['name' => 'folder', 'contents' => $folder],
                    ['name' => 'public_id', 'contents' => $publicId],
                    ['name' => 'overwrite', 'contents' => $params['overwrite']],
                    ['name' => 'signature', 'contents' => $this->sign($params)],
                ]
            );

        if ($response->status() === 409 && ! $overwrite) {
            $existing = $this->findResource($publicId);
            if ($existing !== null) {
                return $existing;
            }
        }

        if (! $response->successful() || blank($response->json('secure_url'))) {
            throw new RuntimeException(
                'Cloudinary upload failed (HTTP '.$response->status().').'
            );
        }

        return [
            'secure_url' => (string) $response->json('secure_url'),
            'public_id' => (string) $response->json('public_id'),
        ];
    }

    /**
     * Upload without replacing an existing asset, returning that asset when it already exists.
     *
     * @return array{secure_url: string, public_id: string}
     */
    public function uploadWithoutOverwrite(string $absolutePath, string $publicId, string $folder): array
    {
        $this->assertConfigured();

        $existing = $this->findResource($publicId);
        if ($existing !== null) {
            return $existing;
        }

        return $this->uploadLocalFile($absolutePath, $publicId, $folder, overwrite: false);
    }

    public function destroy(?string $publicId): bool
    {
        if (! filled($publicId)) {
            return false;
        }

        $this->assertConfigured();

        $timestamp = time();
        $params = [
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ];

        $response = Http::withOptions($this->httpOptions())->asForm()->post(
            sprintf('https://api.cloudinary.com/v1_1/%s/image/destroy', $this->cloudName()),
            [
                ...$params,
                'api_key' => $this->apiKey(),
                'signature' => $this->sign($params),
            ]
        );

        return $response->successful() && ($response->json('result') === 'ok' || $response->json('result') === 'not found');
    }

    public function extractPublicIdFromUrl(string $url): ?string
    {
        if (parse_url($url, PHP_URL_HOST) !== 'res.cloudinary.com') {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            return null;
        }

        $segments = explode('/', trim($path, '/'));
        $uploadIndex = array_search('upload', $segments, true);
        if ($uploadIndex === false) {
            return null;
        }

        $assetSegments = array_slice($segments, $uploadIndex + 1);
        while (
            $assetSegments !== []
            && (str_contains($assetSegments[0], ',') || preg_match('/^v\d+$/', $assetSegments[0]))
        ) {
            array_shift($assetSegments);
        }

        if ($assetSegments === []) {
            return null;
        }

        $lastSegment = array_pop($assetSegments);
        $extensionPosition = strrpos($lastSegment, '.');
        if ($extensionPosition === false || ! preg_match('/^[a-zA-Z0-9]+$/', substr($lastSegment, $extensionPosition + 1))) {
            return null;
        }

        $assetSegments[] = substr($lastSegment, 0, $extensionPosition);

        return implode('/', $assetSegments);
    }

    /**
     * @param  array<string, scalar>  $params
     */
    private function sign(array $params): string
    {
        ksort($params);

        $toSign = collect($params)
            ->map(fn ($value, $key) => $key.'='.$value)
            ->implode('&');

        return sha1($toSign.(string) config('services.cloudinary.api_secret'));
    }

    public function assertConfigured(): void
    {
        if (
            blank(config('services.cloudinary.cloud_name'))
            || blank(config('services.cloudinary.api_key'))
            || blank(config('services.cloudinary.api_secret'))
        ) {
            throw new RuntimeException('Cloudinary is not configured. Set CLOUDINARY_* in backend/.env.');
        }
    }

    /**
     * @return array{secure_url: string, public_id: string}|null
     */
    private function findResource(string $publicId): ?array
    {
        $encodedPublicId = implode('/', array_map('rawurlencode', explode('/', $publicId)));
        $response = Http::withOptions($this->httpOptions())
            ->withBasicAuth($this->apiKey(), (string) config('services.cloudinary.api_secret'))
            ->acceptJson()
            ->get(
                sprintf(
                    'https://api.cloudinary.com/v1_1/%s/resources/image/upload/%s',
                    $this->cloudName(),
                    $encodedPublicId,
                )
            );

        if ($response->status() === 404) {
            return null;
        }

        if (! $response->successful() || blank($response->json('secure_url'))) {
            throw new RuntimeException(
                'Cloudinary resource lookup failed (HTTP '.$response->status().').'
            );
        }

        return [
            'secure_url' => (string) $response->json('secure_url'),
            'public_id' => (string) $response->json('public_id'),
        ];
    }

    /**
     * @return array{verify: string|true}
     */
    private function httpOptions(): array
    {
        $caBundle = trim((string) config('services.cloudinary.ca_bundle', ''));
        if ($caBundle === '' || ! is_file($caBundle) || ! is_readable($caBundle)) {
            return ['verify' => true];
        }

        return ['verify' => $caBundle];
    }
}
