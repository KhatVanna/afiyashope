<?php

namespace App\Logging;

use App\Support\DatabaseUrlSanitizer;
use Illuminate\Log\Logger;
use Monolog\LogRecord;

final class DatabaseUrlSanitizerTap
{
    public function __invoke(Logger $logger): void
    {
        $logger->pushProcessor(static fn (LogRecord $record): LogRecord => $record->with(
            message: DatabaseUrlSanitizer::sanitize($record->message),
            context: DatabaseUrlSanitizer::sanitizeValue($record->context),
            extra: DatabaseUrlSanitizer::sanitizeValue($record->extra),
        ));
    }
}
