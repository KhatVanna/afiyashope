<?php

namespace Tests\Unit;

use App\Support\DatabaseCommandGuard;
use App\Support\DatabaseUrlSanitizer;
use Illuminate\Database\ConfigurationUrlParser;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class DatabaseSafetyTest extends TestCase
{
    public function test_sqlite_connection_ignores_a_postgresql_db_url(): void
    {
        $url = 'postgresql://user:password@db.example.test/database';
        $previousServerValue = $_SERVER['DB_URL'] ?? null;
        $previousEnvValue = $_ENV['DB_URL'] ?? null;
        $previousProcessValue = getenv('DB_URL');
        $_SERVER['DB_URL'] = $url;
        $_ENV['DB_URL'] = $url;
        putenv('DB_URL='.$url);

        try {
            $database = require base_path('config/database.php');
            $sqlite = (new ConfigurationUrlParser)->parseConfiguration($database['connections']['sqlite']);

            $this->assertSame($url, $database['connections']['pgsql']['url']);
            $this->assertSame('sqlite', $sqlite['driver']);
            $this->assertSame(':memory:', $sqlite['database']);
            $this->assertNull($sqlite['url'] ?? null);
        } finally {
            $this->restoreEnvironmentValue('_SERVER', 'DB_URL', $previousServerValue);
            $this->restoreEnvironmentValue('_ENV', 'DB_URL', $previousEnvValue);
            if ($previousProcessValue === false) {
                putenv('DB_URL');
            } else {
                putenv('DB_URL='.$previousProcessValue);
            }
        }
    }

    #[DataProvider('localEnvironmentsProvider')]
    public function test_database_commands_are_blocked_for_neon_without_explicit_approval(string $environment): void
    {
        config([
            'app.env' => $environment,
            'database.default' => 'pgsql',
            'database.connections.pgsql' => [
                'driver' => 'pgsql',
                'url' => 'postgresql://user:password@ep-example.neon.tech/database',
            ],
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Refusing to run migrate against Neon');

        DatabaseCommandGuard::assertSafe('migrate');
    }

    public function test_database_commands_can_be_explicitly_allowed_for_one_command(): void
    {
        $previousValue = $_SERVER['ALLOW_NEON_COMMANDS'] ?? null;
        $_SERVER['ALLOW_NEON_COMMANDS'] = 'true';
        config([
            'app.env' => 'testing',
            'database.default' => 'pgsql',
            'database.connections.pgsql' => [
                'driver' => 'pgsql',
                'url' => 'postgresql://user:password@ep-example.neon.tech/database',
            ],
        ]);

        try {
            $thrown = false;
            try {
                DatabaseCommandGuard::assertSafe('migrate');
            } catch (RuntimeException) {
                $thrown = true;
            }

            $this->assertFalse($thrown);
        } finally {
            $this->restoreEnvironmentValue('_SERVER', 'ALLOW_NEON_COMMANDS', $previousValue);
        }
    }

    public function test_guard_checks_the_explicitly_selected_database_connection(): void
    {
        config([
            'app.env' => 'local',
            'database.default' => 'sqlite',
            'database.connections.sqlite' => ['driver' => 'sqlite', 'url' => null],
            'database.connections.pgsql_direct' => [
                'driver' => 'pgsql',
                'url' => 'postgresql://user:password@ep-example.neon.tech/database',
            ],
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Refusing to run migrate against Neon');

        DatabaseCommandGuard::assertSafe('migrate', 'pgsql_direct');
    }

    public function test_database_url_sanitizer_redacts_urls_in_nested_log_context(): void
    {
        $sanitized = DatabaseUrlSanitizer::sanitizeValue([
            'message' => 'failed for postgresql://user:password@db.example.test/database',
            'nested' => [
                'url' => 'mysql://user:password@db.example.test/database',
            ],
        ]);

        $this->assertSame('failed for [redacted database URL]', $sanitized['message']);
        $this->assertSame('[redacted database URL]', $sanitized['nested']['url']);
    }

    public function test_database_url_sanitizer_redacts_urls_from_exception_messages(): void
    {
        $sanitized = DatabaseUrlSanitizer::sanitizeValue(
            new RuntimeException('Unable to connect: postgresql://user:password@db.example.test/database'),
        );

        $this->assertSame('RuntimeException', $sanitized['class']);
        $this->assertSame('Unable to connect: [redacted database URL]', $sanitized['message']);
    }

    #[DataProvider('databaseCommandProvider')]
    public function test_database_command_detection(string $command, bool $expected): void
    {
        $this->assertSame($expected, DatabaseCommandGuard::isDatabaseCommand($command));
    }

    public static function databaseCommandProvider(): array
    {
        return [
            'migrate' => ['migrate', true],
            'migration subcommand' => ['migrate:status', true],
            'database command' => ['db:seed', true],
            'schema command' => ['schema:dump', true],
            'non-database command' => ['route:list', false],
        ];
    }

    public static function localEnvironmentsProvider(): array
    {
        return [
            'local' => ['local'],
            'testing' => ['testing'],
            'production' => ['production'],
        ];
    }

    private function restoreEnvironmentValue(string $superglobal, string $key, mixed $value): void
    {
        if ($value === null) {
            unset($GLOBALS[$superglobal][$key]);

            return;
        }

        $GLOBALS[$superglobal][$key] = $value;
    }
}
