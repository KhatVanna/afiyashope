<?php

namespace App\Support;

final class NeonDatabaseUrl
{
    public static function resolveMigrationUrl(?string $directUrl, ?string $runtimeUrl): ?string
    {
        $directUrl = is_string($directUrl) ? trim($directUrl) : '';
        if ($directUrl !== '') {
            return $directUrl;
        }

        $runtimeUrl = is_string($runtimeUrl) ? trim($runtimeUrl) : '';

        return self::isDirect($runtimeUrl) ? $runtimeUrl : null;
    }

    public static function host(?string $url): ?string
    {
        if (! is_string($url) || trim($url) === '') {
            return null;
        }

        $host = parse_url(trim($url), PHP_URL_HOST);

        return is_string($host) && $host !== '' ? strtolower($host) : null;
    }

    public static function isDirect(?string $url): bool
    {
        $host = self::host($url);

        return $host !== null && ! str_contains($host, '-pooler');
    }

    public static function isNeonDirect(?string $url): bool
    {
        $host = self::host($url);

        return $host !== null
            && str_ends_with($host, '.neon.tech')
            && ! str_contains($host, '-pooler');
    }
}
