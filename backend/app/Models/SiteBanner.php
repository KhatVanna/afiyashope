<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteBanner extends Model
{
    protected $fillable = [
        'media_type',
        'media_url',
        'mobile_media_url',
        'poster_url',
        'eyebrow_km',
        'eyebrow_en',
        'headline_km',
        'headline_en',
        'subtitle_km',
        'subtitle_en',
        'button_text_km',
        'button_text_en',
        'button_url',
        'text_align',
        'overlay_opacity',
        'is_active',
        'sort_order',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'overlay_opacity' => 'integer',
            'sort_order' => 'integer',
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
        ];
    }

    /**
     * Public serialization intentionally excludes database timestamps and editor metadata.
     *
     * @return array<string, int|string|bool|null>
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'media_type' => $this->media_type,
            'media_url' => $this->media_url,
            'mobile_media_url' => $this->mobile_media_url,
            'poster_url' => $this->poster_url,
            'eyebrow_km' => $this->eyebrow_km,
            'eyebrow_en' => $this->eyebrow_en,
            'headline_km' => $this->headline_km,
            'headline_en' => $this->headline_en,
            'subtitle_km' => $this->subtitle_km,
            'subtitle_en' => $this->subtitle_en,
            'button_text_km' => $this->button_text_km,
            'button_text_en' => $this->button_text_en,
            'button_url' => $this->button_url,
            'text_align' => $this->text_align,
            'overlay_opacity' => $this->overlay_opacity,
        ];
    }
}
