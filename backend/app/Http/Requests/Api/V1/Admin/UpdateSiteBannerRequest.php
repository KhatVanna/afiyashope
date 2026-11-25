<?php

namespace App\Http\Requests\Api\V1\Admin;

class UpdateSiteBannerRequest extends SiteBannerRequest
{
    public function rules(): array
    {
        return $this->bannerRules();
    }
}
