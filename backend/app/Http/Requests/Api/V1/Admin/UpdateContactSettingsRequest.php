<?php

namespace App\Http\Requests\Api\V1\Admin;

use Closure;

class UpdateContactSettingsRequest extends UpdateSiteSettingsRequest
{
    protected function groupRules(): array
    {
        return [
            'data.phone' => [
                'sometimes', 'nullable', 'string', 'max:40',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if ($value !== null && $value !== '' && ! preg_match('/^\+?[0-9][0-9\s().-]{5,38}$/', $value)) {
                        $fail('The '.$attribute.' must be a valid phone number.');
                    }
                },
            ],
            'data.whatsapp_url' => $this->httpsOrRelativeUrl(allowRelative: false),
            'data.email' => ['sometimes', 'nullable', 'email', 'max:254'],
            'data.address_km' => ['sometimes', 'nullable', 'string', 'max:500'],
            'data.address_en' => ['sometimes', 'nullable', 'string', 'max:500'],
            'data.map_url' => $this->httpsOrRelativeUrl(allowRelative: false),
            'data.facebook_url' => $this->httpsOrRelativeUrl(allowRelative: false),
            'data.instagram_url' => $this->httpsOrRelativeUrl(allowRelative: false),
            'data.tiktok_url' => $this->httpsOrRelativeUrl(allowRelative: false),
            'data.telegram_url' => $this->httpsOrRelativeUrl(allowRelative: false),
            'data.business_hours_km' => ['sometimes', 'nullable', 'string', 'max:500'],
            'data.business_hours_en' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
