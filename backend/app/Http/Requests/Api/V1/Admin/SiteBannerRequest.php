<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Http\Requests\Concerns\ApiValidationErrors;
use App\Models\SiteBanner;
use App\Support\ApiResponse;
use App\Support\SiteBannerMedia;
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
        $input = $this->stripTagsRecursively($this->all());
        unset($input['media_type']);

        foreach ([
            'mobile_media_url',
            'poster_url',
            'eyebrow_km',
            'eyebrow_en',
            'headline_km',
            'headline_en',
            'subtitle_km',
            'subtitle_en',
            'button_text_km',
            'button_text_en',
            'button_url',
            'starts_at',
            'ends_at',
        ] as $field) {
            if (isset($input[$field]) && is_string($input[$field]) && trim($input[$field]) === '') {
                $input[$field] = null;
            }
        }

        $this->replace($input);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $end = $this->input('ends_at');
            if (is_string($end)
                && ! $validator->errors()->has('ends_at')
                && ! $validator->errors()->has('starts_at')) {
                $start = $this->input('starts_at');
                if (! array_key_exists('starts_at', $this->all())) {
                    $banner = $this->route('banner');
                    $start = $banner instanceof SiteBanner ? $banner->starts_at : null;
                }

                if ($start && Carbon::parse($end)->lt(Carbon::parse($start))) {
                    $validator->errors()->add('ends_at', 'The ends_at field must be after or equal to starts_at.');
                }
            }

        });
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    protected function bannerRules(): array
    {
        return [
            'media_url' => ['required', 'string', 'max:2048', $this->mediaUrlRule(['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'])],
            'mobile_media_url' => ['sometimes', 'nullable', 'string', 'max:2048', $this->mediaUrlRule(['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'], allowRelative: true)],
            'poster_url' => ['sometimes', 'nullable', 'string', 'max:2048', $this->mediaUrlRule(['jpg', 'jpeg', 'png', 'webp'], allowRelative: true)],
            'eyebrow_km' => ['sometimes', 'nullable', 'string', 'max:160'],
            'eyebrow_en' => ['sometimes', 'nullable', 'string', 'max:160'],
            'headline_km' => ['sometimes', 'nullable', 'string', 'max:240'],
            'headline_en' => ['sometimes', 'nullable', 'string', 'max:240'],
            'subtitle_km' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'subtitle_en' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'button_text_km' => ['sometimes', 'nullable', 'string', 'max:100'],
            'button_text_en' => ['sometimes', 'nullable', 'string', 'max:100'],
            'button_url' => ['sometimes', 'nullable', 'string', 'max:2048', $this->buttonUrlRule()],
            'text_align' => ['sometimes', 'string', Rule::in(['left', 'center', 'right'])],
            'overlay_opacity' => ['sometimes', 'integer', 'between:0,80'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
        ];
    }

    /**
     * @param  array<int, string>  $extensions
     */
    private function mediaUrlRule(array $extensions, bool $allowRelative = false): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($extensions, $allowRelative): void {
            if ($value === null && $attribute !== 'media_url') {
                return;
            }

            if (! is_string($value) || ! SiteBannerMedia::isAllowedMediaUrl($value, $extensions, $allowRelative)) {
                $fail('The '.$attribute.' must use an allowed media URL and file extension.');
            }
        };
    }

    private function buttonUrlRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if ($value === null) {
                return;
            }

            if (! is_string($value)) {
                $fail('The '.$attribute.' must be an HTTPS URL or a relative path.');

                return;
            }

            if (str_starts_with($value, '/')) {
                if (! str_starts_with($value, '//')
                    && ! str_contains($value, '\\')
                    && ! preg_match('/[\x00-\x20]/', $value)) {
                    return;
                }
            } elseif (filter_var($value, FILTER_VALIDATE_URL) !== false) {
                $parts = parse_url($value);
                if (is_array($parts)
                    && strtolower($parts['scheme'] ?? '') === 'https'
                    && ! isset($parts['user'])
                    && ! isset($parts['pass'])) {
                    return;
                }
            }

            $fail('The '.$attribute.' must be an HTTPS URL or a relative path.');
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
