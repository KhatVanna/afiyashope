<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Http\Requests\Concerns\ApiValidationErrors;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class UpdateSiteSettingsRequest extends FormRequest
{
    use ApiValidationErrors;

    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'super-admin']) ?? false;
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            ApiResponse::error('You do not have permission to manage site settings.', 403)
        );
    }

    protected function prepareForValidation(): void
    {
        $data = $this->input('data');
        if (is_array($data)) {
            $this->merge(['data' => $this->stripTagsRecursively($data)]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'data' => ['required', 'array'],
            ...$this->groupRules(),
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    abstract protected function groupRules(): array;

    /**
     * @return array<int, mixed>
     */
    protected function httpsOrRelativeUrl(bool $required = false, bool $allowRelative = true): array
    {
        return [
            $required ? 'required' : 'sometimes',
            'nullable',
            'string',
            'max:2048',
            function (string $attribute, mixed $value, Closure $fail) use ($allowRelative): void {
                if ($value === null || $value === '') {
                    return;
                }

                if (! is_string($value)) {
                    $fail('The '.$attribute.' must be an HTTPS URL or a relative path.');

                    return;
                }

                $isHttpsUrl = preg_match('~^https://~i', $value) === 1
                    && filter_var($value, FILTER_VALIDATE_URL) !== false;
                $isRelativePath = $allowRelative
                    && str_starts_with($value, '/')
                    && ! str_starts_with($value, '//')
                    && ! str_contains($value, '\\')
                    && ! preg_match('/[\x00-\x20]/', $value);

                if (! $isHttpsUrl && ! $isRelativePath) {
                    $fail('The '.$attribute.' must be a valid HTTPS URL or an allowed relative path.');
                }
            },
        ];
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
