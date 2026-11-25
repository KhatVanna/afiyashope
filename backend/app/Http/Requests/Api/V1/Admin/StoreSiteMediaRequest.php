<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Http\Requests\Concerns\ApiValidationErrors;
use App\Support\ApiResponse;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StoreSiteMediaRequest extends FormRequest
{
    use ApiValidationErrors;

    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'super-admin']) ?? false;
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            ApiResponse::error('You do not have permission to upload site media.', 403)
        );
    }

    public function rules(): array
    {
        $kind = $this->input('kind');
        $fileRules = match ($kind) {
            'logo' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,webp,svg'],
            'favicon', 'banner_image', 'poster' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,webp'],
            'banner_video' => ['required', 'file', 'max:15360', 'mimes:mp4,webm'],
            default => ['required', 'file'],
        };

        return [
            'kind' => ['required', 'string', Rule::in(['logo', 'favicon', 'banner_image', 'banner_video', 'poster'])],
            'file' => $fileRules,
        ];
    }
}
