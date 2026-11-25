<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Brand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        $brand = $this->route('brand');

        return $brand instanceof Brand && ($this->user()?->can('update', $brand) ?? false);
    }

    public function rules(): array
    {
        $brand = $this->route('brand');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('brands', 'name')->ignore($brand instanceof Brand ? $brand->id : null),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
