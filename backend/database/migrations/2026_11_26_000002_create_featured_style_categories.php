<?php

use App\Support\CatalogCache;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $inserted = DB::table('categories')->insertOrIgnore([
            [
                'name' => 'Pastel Colors',
                'name_km' => 'ពណ៌ប៉ាស្តែល',
                'slug' => 'pastel-colors',
                'is_active' => true,
                'sort_order' => 1000,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Luxury Styles',
                'name_km' => 'ម៉ូដប្រណិត',
                'slug' => 'luxury-styles',
                'is_active' => true,
                'sort_order' => 1001,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Matching Sets',
                'name_km' => 'ឈុតពេញ',
                'slug' => 'matching-sets',
                'is_active' => true,
                'sort_order' => 1002,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        if ($inserted > 0) {
            CatalogCache::bust();
        }
    }

    public function down(): void
    {
        // Keep these categories because an administrator may have edited them or assigned products.
    }
};
