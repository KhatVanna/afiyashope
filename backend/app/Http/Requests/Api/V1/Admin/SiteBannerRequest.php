<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Http\Requests\Concerns\ApiValidationErrors;
use App\Models\SiteBanner;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

abstract class SiteBannerRequest extends FormRequest
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

    protected function prepareForValidation(): void
    {
        $this->merge($this->stripTagsRecursively($this->all()));
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $end = $this->input('ends_at');
            if (! is_string($end) || $end === '' || $validator->errors()->has('ends_at')) {
                return;
            }

            $start = $this->input('starts_at');
            if (! array_key_exists('starts_at', $this->all())) {
                $banner = $this->route('banner');
                $start = $banner instanceof SiteBanner ? $banner->starts_at : null;
            }

            if ($start && Carbon::parse($end)->lt(Carbon::parse($start))) {
                $validator->errors()->add('ends_at', 'The ends_at field must be after or equal to starts_at.');
            }
        });
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    protected function bannerRules(bool $creating): array
    {
        $required = $creating ? ['required'] : ['sometimes', 'required'];

        return [
            'media_type' => [...$required, 'string', Rule::in(['image', 'video'])],
            'media_url' => [...$required, 'string', 'max:2048', $this->urlRule()],
            'mobile_media_url' => ['sometimes', 'nullable', 'string', 'max:2048', $this->urlRule()],
            'poster_url' => ['sometimes', 'nullable', 'string', 'max:2048', $this->urlRule()],
            'eyebrow_km' => ['sometimes', 'nullable', 'string', 'max:160'],
            'eyebrow_en' => ['sometimes', 'nullable', 'string', 'max:160'],
            'headline_km' => [...$required, 'string', 'max:240'],
            'headline_en' => [...$required, 'string', 'max:240'],
            'subtitle_km' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'subtitle_en' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'button_text_km' => ['sometimes', 'nullable', 'string', 'max:100'],
            'button_text_en' => ['sometimes', 'nullable', 'string', 'max:100'],
            'button_url' => ['sometimes', 'nullable', 'string', 'max:2048', $this->urlRule()],
            'text_align' => ['sometimes', 'string', Rule::in(['left', 'center', 'right'])],
            'overlay_opacity' => ['sometimes', 'integer', 'between:0,80'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }

    private function urlRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if ($value === null || $value === '') {
                return;
            }

            if (! is_string($value)) {
                $fail('The '.$attribute.' must be an HTTPS URL or a relative path.');

                return;
            }

            $isHttpsUrl = preg_match('~^https://~i', $value) === 1
                && filter_var($value, FILTER_VALIDATE_URL) !== false;
            $isRelativePath = str_starts_with($value, '/')
                && ! str_starts_with($value, '//')
                && ! str_contains($value, '\\')
                && ! preg_match('/[\x00-\x20]/', $value);

            if (! $isHttpsUrl && ! $isRelativePath) {
                $fail('The '.$attribute.' must be a valid HTTPS URL or a relative path.');
            }
        };
    }

    private function stripTagsRecursively(array $values): array
    {
        foreach ($values as $key => $value) {
            if (is_array($value)) {
                $values[$key] = $this->stripTagsRecursively($value);
            } elseif (is_string($value)) {
                $values[$key] = strip_tags($value);
            }
        }

        return $values;
    }
}
