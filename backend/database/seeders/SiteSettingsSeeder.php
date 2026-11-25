<?php

namespace Database\Seeders;

use App\Models\SiteBanner;
use App\Models\SiteSetting;
use App\Support\SiteContentCache;
use App\Support\SiteSettingsDefaults;
use Illuminate\Database\Seeder;

class SiteSettingsSeeder extends Seeder
{
    public function run(): void
    {
        foreach (SiteSettingsDefaults::groups() as $group => $data) {
            SiteSetting::query()->firstOrCreate(
                ['group' => $group],
                ['data' => $data],
            );
        }

        if (! SiteBanner::query()->exists()) {
            SiteBanner::query()->create(SiteSettingsDefaults::defaultBanner());
        }

        SiteContentCache::clear();
    }
}
