<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_demo')->default(false)->index();
            $table->string('product_key')->nullable()->unique();
        });

        Schema::table('product_images', function (Blueprint $table) {
            $table->string('url')->nullable();
            $table->string('cloudinary_public_id')->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->dropUnique(['cloudinary_public_id']);
            $table->dropColumn(['url', 'cloudinary_public_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['product_key']);
            $table->dropIndex(['is_demo']);
            $table->dropColumn(['is_demo', 'product_key']);
        });
    }
};
