<?php

namespace App\Http\Requests\Api\V1\Admin;

class UpdateBrandingSettingsRequest extends UpdateSiteSettingsRequest
{
    protected function groupRules(): array
    {
        return [
            'data.logo_light' => $this->httpsOrRelativeUrl(),
            'data.logo_dark' => $this->httpsOrRelativeUrl(),
            'data.favicon' => $this->httpsOrRelativeUrl(),
            'data.primary_color' => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'data.secondary_color' => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
