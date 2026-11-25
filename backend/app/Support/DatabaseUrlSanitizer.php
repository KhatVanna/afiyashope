<?php

namespace App\Support;

use Stringable;
use Throwable;

final class DatabaseUrlSanitizer
{
    public static function sanitize(string $message): string
    {
        return preg_replace(
            '/(?:postgres(?:ql)?|mysql|mariadb|sqlite|sqlsrv):\/\/[^\s\'"`<>]+/i',
            '[redacted database URL]',
            $message,
        ) ?? $message;
    }

    public static function sanitizeValue(mixed $value): mixed
    {
        if (is_string($value)) {
            return self::sanitize($value);
        }

        if ($value instanceof Throwable) {
            return [
                'class' => $value::class,
                'message' => self::sanitize($value->getMessage()),
            ];
        }

        if ($value instanceof Stringable) {
            return self::sanitize((string) $value);
        }

        if (is_array($value)) {
            foreach ($value as $key => $item) {
                $value[$key] = self::sanitizeValue($item);
            }
        }

        return $value;
    }
}
