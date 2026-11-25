<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('group')->unique();
            $table->json('data');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('site_banners', function (Blueprint $table) {
            $table->id();
            $table->string('media_type');
            $table->text('media_url');
            $table->text('mobile_media_url')->nullable();
            $table->text('poster_url')->nullable();
            $table->string('eyebrow_km', 160)->nullable();
            $table->string('eyebrow_en', 160)->nullable();
            $table->string('headline_km', 240);
            $table->string('headline_en', 240);
            $table->text('subtitle_km')->nullable();
            $table->text('subtitle_en')->nullable();
            $table->string('button_text_km', 100)->nullable();
            $table->string('button_text_en', 100)->nullable();
            $table->text('button_url')->nullable();
            $table->string('text_align', 10)->default('left');
            $table->unsignedTinyInteger('overlay_opacity')->default(40);
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamp('starts_at')->nullable()->index();
            $table->timestamp('ends_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_banners');
        Schema::dropIfExists('site_settings');
    }
};
