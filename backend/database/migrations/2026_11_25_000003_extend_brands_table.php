<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('brands', 'logo') && ! Schema::hasColumn('brands', 'logo_url')) {
            Schema::table('brands', function (Blueprint $table) {
                $table->renameColumn('logo', 'logo_url');
            });
        }

        Schema::table('brands', function (Blueprint $table) {
            if (! Schema::hasColumn('brands', 'logo_url')) {
                $table->string('logo_url')->nullable();
            }

            if (! Schema::hasColumn('brands', 'logo_public_id')) {
                $table->string('logo_public_id')->nullable();
            }

            if (! Schema::hasColumn('brands', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(0);
            }
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->string('name', 100)->change();
            $table->unique('name');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('brand_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_brand_id_index');
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->dropUnique('brands_name_unique');
            $table->string('name')->change();
            $table->dropColumn(['logo_public_id', 'sort_order']);
        });

        if (Schema::hasColumn('brands', 'logo_url') && ! Schema::hasColumn('brands', 'logo')) {
            Schema::table('brands', function (Blueprint $table) {
                $table->renameColumn('logo_url', 'logo');
            });
        } elseif (Schema::hasColumn('brands', 'logo_url')) {
            Schema::table('brands', function (Blueprint $table) {
                $table->dropColumn('logo_url');
            });
        }
    }
};
