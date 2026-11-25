<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Brand;
use Illuminate\Foundation\Http\FormRequest;

class UploadBrandLogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $brand = $this->route('brand');

        return $brand instanceof Brand && ($this->user()?->can('update', $brand) ?? false);
    }

    public function rules(): array
    {
        return [
            'logo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
