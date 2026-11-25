<?php

namespace App\Support;

use Illuminate\Database\ConfigurationUrlParser;
use RuntimeException;

final class DatabaseCommandGuard
{
    public static function isDatabaseCommand(string $command): bool
    {
        return $command === 'migrate'
            || str_starts_with($command, 'migrate:')
            || str_starts_with($command, 'db:')
            || str_starts_with($command, 'schema:');
    }

    public static function assertSafe(string $command, ?string $connectionName = null): void
    {
        $environment = (string) config('app.env');
        if (self::neonCommandsAllowed()) {
            return;
        }

        $connectionName = $connectionName ?: (string) config('database.default');
        $connection = config('database.connections.'.$connectionName);
        if (! is_array($connection)) {
            return;
        }

        $effectiveConnection = (new ConfigurationUrlParser)->parseConfiguration($connection);
        $host = strtolower((string) ($effectiveConnection['host'] ?? ''));

        if (str_contains($host, 'neon.tech')) {
            throw new RuntimeException(
                'Refusing to run '.$command.' against Neon while APP_ENV='.$environment.'. Set ALLOW_NEON_COMMANDS=true only for this explicitly approved command.'
            );
        }
    }

    private static function neonCommandsAllowed(): bool
    {
        $value = $_SERVER['ALLOW_NEON_COMMANDS']
            ?? $_ENV['ALLOW_NEON_COMMANDS']
            ?? getenv('ALLOW_NEON_COMMANDS');

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
