<?php

namespace App\Console\Commands;

use App\Support\NeonDatabaseUrl;
use Illuminate\Console\Command;
use Illuminate\Database\Connectors\ConnectionException;
use Illuminate\Support\Facades\DB;
use PDOException;

class NeonPreflight extends Command
{
    protected $signature = 'neon:preflight {--database=pgsql_direct : Connection to use for the read-only probe}';

    protected $description = 'Check Neon connection readiness without changing database data.';

    public function handle(): int
    {
        $direct = (array) config('database.connections.pgsql_direct', []);
        $directUrl = $direct['url'] ?? null;
        $directConfigured = $this->hasPostgresUrl($direct)
            && NeonDatabaseUrl::isDirect(is_string($directUrl) ? $directUrl : null);
        $sslmodeRequired = $directConfigured && $this->requiresSsl($direct);
        $directHost = $this->host($direct);
        $targetNotLocal = $directConfigured && ! $this->isLocalHost($directHost);
        $targetIsNeon = $targetNotLocal && $this->isNeonHost($directHost);
        $connectionCanConnect = false;
        $rolesEmpty = false;
        $permissionsEmpty = false;
        $ownerExists = false;
        $readChecksCompleted = false;
        $channelBindingUnsupported = false;

        if (
            $this->option('database') === 'pgsql_direct'
            && $directConfigured
            && $sslmodeRequired
            && $targetIsNeon
        ) {
            try {
                $connection = DB::connection('pgsql_direct');
                $connection->getPdo();
                $connectionCanConnect = true;
            } catch (ConnectionException|PDOException $exception) {
                $channelBindingUnsupported = $this->isChannelBindingUnsupported($exception);
            }

            if ($connectionCanConnect) {
                try {
                    $schema = $connection->getSchemaBuilder();
                    $rolesEmpty = ! $schema->hasTable('roles')
                        || $connection->table('roles')->count() === 0;
                    $permissionsEmpty = ! $schema->hasTable('permissions')
                        || $connection->table('permissions')->count() === 0;
                    $ownerEmail = config('app.owner_email');
                    $ownerExists = is_string($ownerEmail)
                        && filter_var($ownerEmail, FILTER_VALIDATE_EMAIL) !== false
                        && $schema->hasTable('users')
                        && $connection->table('users')->where('email', $ownerEmail)->exists();
                    $readChecksCompleted = true;
                } catch (ConnectionException|PDOException) {
                    $readChecksCompleted = false;
                }
            }
        }

        $this->line('direct_connection_configured='.($directConfigured ? 'true' : 'false'));
        $this->line('sslmode_require='.($sslmodeRequired ? 'true' : 'false'));
        $this->line('target_not_local='.($targetNotLocal ? 'true' : 'false'));
        $this->line('target_is_neon='.($targetIsNeon ? 'true' : 'false'));
        $this->line('connection_can_connect='.($connectionCanConnect ? 'true' : 'false'));
        $this->line('roles_table_empty='.($rolesEmpty ? 'true' : 'false'));
        $this->line('permissions_table_empty='.($permissionsEmpty ? 'true' : 'false'));
        $this->line('owner_email_exists='.($ownerExists ? 'true' : 'false'));

        if ($channelBindingUnsupported) {
            $this->line('sanitized_error=Current PDO_PGSQL/libpq rejected channel_binding=require; connection details suppressed.');
        }

        return $directConfigured
            && $sslmodeRequired
            && $targetNotLocal
            && $targetIsNeon
            && $connectionCanConnect
            && $readChecksCompleted
            ? self::SUCCESS
            : self::FAILURE;
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function hasPostgresUrl(array $connection): bool
    {
        $url = $connection['url'] ?? null;

        return ($connection['driver'] ?? null) === 'pgsql'
            && is_string($url)
            && trim($url) !== ''
            && is_string(parse_url($url, PHP_URL_HOST))
            && parse_url($url, PHP_URL_HOST) !== '';
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function requiresSsl(array $connection): bool
    {
        $url = $connection['url'] ?? null;
        $query = is_string($url) ? parse_url($url, PHP_URL_QUERY) : null;
        parse_str(is_string($query) ? $query : '', $options);
        $sslmode = $options['sslmode'] ?? ($connection['sslmode'] ?? null);

        return is_string($sslmode) && strtolower($sslmode) === 'require';
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function host(array $connection): ?string
    {
        $url = $connection['url'] ?? null;
        $host = is_string($url) ? parse_url($url, PHP_URL_HOST) : null;

        if (is_string($host) && $host !== '') {
            return strtolower($host);
        }

        $host = $connection['host'] ?? null;

        return is_string($host) && $host !== '' ? strtolower($host) : null;
    }

    private function isLocalHost(?string $host): bool
    {
        return $host === null || in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }

    private function isNeonHost(?string $host): bool
    {
        return is_string($host) && str_ends_with($host, '.neon.tech');
    }

    private function isChannelBindingUnsupported(ConnectionException|PDOException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'channel_binding')
            && (
                str_contains($message, 'invalid connection option')
                || str_contains($message, 'unsupported')
                || str_contains($message, 'unrecognized')
                || str_contains($message, 'unknown option')
            );
    }
}
