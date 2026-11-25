<?php

namespace App\Support;

class SiteBannerMedia
{
    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    private const VIDEO_EXTENSIONS = ['mp4', 'webm'];

    /**
     * @param  array<int, string>  $extensions
     */
    public static function isAllowedMediaUrl(
        string $url,
        array $extensions,
        bool $allowRelative = false,
    ): bool {
        if ($allowRelative && str_starts_with($url, '/')) {
            if (str_starts_with($url, '//')
                || str_contains($url, '\\')
                || preg_match('/[\x00-\x20]/', $url)) {
                return false;
            }

            $path = parse_url($url, PHP_URL_PATH);
            $extension = is_string($path)
                ? strtolower(pathinfo($path, PATHINFO_EXTENSION))
                : '';

            return in_array($extension, $extensions, true);
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $parts = parse_url($url);
        if (! is_array($parts)
            || strtolower($parts['scheme'] ?? '') !== 'https'
            || empty($parts['host'])
            || isset($parts['user'])
            || isset($parts['pass'])) {
            return false;
        }

        $host = strtolower(rtrim($parts['host'], '.'));
        $ip = trim($host, '[]');
        if (in_array($host, ['localhost', 'localhost.localdomain', 'host.docker.internal'], true)
            || str_ends_with($host, '.localhost')
            || str_ends_with($host, '.local')
            || str_ends_with($host, '.internal')) {
            return false;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP)
            && filter_var(
                $ip,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
            ) === false) {
            return false;
        }

        $path = $parts['path'] ?? '';
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return in_array($extension, $extensions, true);
    }

    public static function typeFromUrl(string $url): ?string
    {
        $parts = parse_url($url);
        $extension = is_array($parts)
            ? strtolower(pathinfo($parts['path'] ?? '', PATHINFO_EXTENSION))
            : '';

        return match (true) {
            in_array($extension, self::IMAGE_EXTENSIONS, true) => 'image',
            in_array($extension, self::VIDEO_EXTENSIONS, true) => 'video',
            default => null,
        };
    }
}
