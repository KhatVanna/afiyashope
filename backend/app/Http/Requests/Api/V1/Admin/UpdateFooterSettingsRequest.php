<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Validation\Rule;

class UpdateFooterSettingsRequest extends UpdateSiteSettingsRequest
{
    protected function groupRules(): array
    {
        return [
            'data.about_km' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'data.about_en' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'data.quick_links' => ['sometimes', 'array', 'max:20'],
            'data.quick_links.*' => ['array:label_km,label_en,url'],
            'data.quick_links.*.label_km' => ['required_with:data.quick_links.*.url', 'string', 'max:120'],
            'data.quick_links.*.label_en' => ['nullable', 'string', 'max:120'],
            'data.quick_links.*.url' => $this->httpsOrRelativeUrl(true),
            'data.policy_links' => ['sometimes', 'array:privacy,returns,shipping,terms'],
            'data.policy_links.privacy' => $this->httpsOrRelativeUrl(),
            'data.policy_links.returns' => $this->httpsOrRelativeUrl(),
            'data.policy_links.shipping' => $this->httpsOrRelativeUrl(),
            'data.policy_links.terms' => $this->httpsOrRelativeUrl(),
            'data.payment_methods' => ['sometimes', 'array:aba,acleda,wing,khqr,cash_on_delivery'],
            'data.payment_methods.aba' => ['sometimes', 'boolean'],
            'data.payment_methods.acleda' => ['sometimes', 'boolean'],
            'data.payment_methods.wing' => ['sometimes', 'boolean'],
            'data.payment_methods.khqr' => ['sometimes', 'boolean'],
            'data.payment_methods.cash_on_delivery' => ['sometimes', 'boolean'],
            'data.payment_methods.*' => ['sometimes', 'boolean', Rule::in([true, false, 0, 1, '0', '1'])],
            'data.copyright_km' => ['sometimes', 'nullable', 'string', 'max:300'],
            'data.copyright_en' => ['sometimes', 'nullable', 'string', 'max:300'],
        ];
    }
}
