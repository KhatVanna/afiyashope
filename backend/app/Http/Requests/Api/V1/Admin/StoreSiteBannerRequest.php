<?php

namespace App\Http\Requests\Api\V1\Admin;

class StoreSiteBannerRequest extends SiteBannerRequest
{
    public function rules(): array
    {
        return $this->bannerRules(creating: true);
    }
}
