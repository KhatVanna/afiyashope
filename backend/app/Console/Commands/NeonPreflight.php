<?php

namespace App\Console\Commands;

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
        $pooled = (array) config('database.connections.pgsql', []);
        $direct = (array) config('database.connections.pgsql_direct', []);

        $pooledConfigured = $this->hasPostgresUrl($pooled);
        $directConfigured = $this->hasPostgresUrl($direct);
        $sslmodeRequired = $pooledConfigured
            && $directConfigured
            && $this->requiresSsl($pooled)
            && $this->requiresSsl($direct);
        $targetNotLocal = $pooledConfigured
            && $directConfigured
            && ! $this->isLocalHost($this->host($pooled))
            && ! $this->isLocalHost($this->host($direct));
        $targetIsNeon = $targetNotLocal
            && $this->isNeonHost($this->host($pooled))
            && $this->isNeonHost($this->host($direct));
        $selectedConnectionIsDirect = $this->option('database') === 'pgsql_direct';

        $this->line('pooled_connection_configured='.($pooledConfigured ? 'true' : 'false'));
        $this->line('direct_connection_configured='.($directConfigured ? 'true' : 'false'));
        $this->line('sslmode_require='.($sslmodeRequired ? 'true' : 'false'));
        $this->line('target_not_local='.($targetNotLocal ? 'true' : 'false'));
        $this->line('target_is_neon='.($targetIsNeon ? 'true' : 'false'));
        $this->line('selected_connection_is_direct='.($selectedConnectionIsDirect ? 'true' : 'false'));

        if (! $pooledConfigured || ! $directConfigured || ! $sslmodeRequired || ! $targetIsNeon || ! $selectedConnectionIsDirect) {
            $this->line('connection_can_connect=false');

            return self::FAILURE;
        }

        try {
            $connection = DB::connection('pgsql_direct');
            $connection->getPdo();
        } catch (ConnectionException|PDOException $exception) {
            $this->line('connection_can_connect=false');
            $this->line('connection_error_details_suppressed=true');

            return self::FAILURE;
        }

        $this->line('connection_can_connect=true');

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
        } catch (ConnectionException|PDOException $exception) {
            $this->line('read_checks_completed=false');
            $this->line('read_error_details_suppressed=true');

            return self::FAILURE;
        }

        $this->line('roles_table_empty='.($rolesEmpty ? 'true' : 'false'));
        $this->line('permissions_table_empty='.($permissionsEmpty ? 'true' : 'false'));
        $this->line('owner_email_exists='.($ownerExists ? 'true' : 'false'));
        $this->line('read_checks_completed=true');

        return self::SUCCESS;
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
}
