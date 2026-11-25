<?php

namespace App\Support;

class DatabaseTargetGuard
{
    public static function isRemote(): bool
    {
        $connection = (array) config('database.connections.'.config('database.default'), []);
        if (($connection['driver'] ?? null) === 'sqlite') {
            return false;
        }

        $url = $connection['url'] ?? null;
        $host = is_string($url) ? parse_url($url, PHP_URL_HOST) : null;
        $host = is_string($host) && $host !== ''
            ? $host
            : ($connection['host'] ?? null);

        if (! is_string($host) || $host === '') {
            return true;
        }

        return ! in_array(strtolower($host), ['localhost', '127.0.0.1', '::1'], true);
    }
}
