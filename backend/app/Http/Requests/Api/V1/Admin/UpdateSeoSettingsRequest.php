<?php

namespace App\Http\Requests\Api\V1\Admin;

class UpdateSeoSettingsRequest extends UpdateSiteSettingsRequest
{
    protected function groupRules(): array
    {
        return [
            'data.site_title_km' => ['sometimes', 'nullable', 'string', 'max:120'],
            'data.site_title_en' => ['sometimes', 'nullable', 'string', 'max:120'],
            'data.meta_description_km' => ['sometimes', 'nullable', 'string', 'max:320'],
            'data.meta_description_en' => ['sometimes', 'nullable', 'string', 'max:320'],
            'data.og_image' => $this->httpsOrRelativeUrl(),
            'data.keywords' => ['sometimes', 'array', 'max:30'],
            'data.keywords.*' => ['string', 'max:80'],
            'data.google_analytics_id' => ['sometimes', 'nullable', 'string', 'max:32', 'regex:/^G-[A-Z0-9]{6,}$/'],
        ];
    }
}
