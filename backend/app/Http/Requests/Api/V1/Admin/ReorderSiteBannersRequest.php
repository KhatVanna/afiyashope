<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Http\Requests\Concerns\ApiValidationErrors;
use App\Support\ApiResponse;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ReorderSiteBannersRequest extends FormRequest
{
    use ApiValidationErrors;

    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'super-admin']) ?? false;
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            ApiResponse::error('You do not have permission to manage site banners.', 403)
        );
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer', 'distinct', 'exists:site_banners,id'],
        ];
    }
}
