<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class SiteContentCache
{
    public const SETTINGS_KEY = 'public-site-settings-v1';

    public const BANNERS_KEY = 'public-site-banners-v1';

    public static function clear(): void
    {
        Cache::forget(self::SETTINGS_KEY);
        Cache::forget(self::BANNERS_KEY);
    }
}
