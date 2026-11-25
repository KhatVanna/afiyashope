<?php

namespace App\Http\Requests\Concerns;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

trait ApiValidationErrors
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('The given data was invalid.', 422, $validator->errors())
        );
    }
}
