<?php

namespace App\Console\Commands;

use App\Support\NeonDatabaseUrl;
use Illuminate\Console\Command;
use Illuminate\Database\Connectors\ConnectionException;
use Illuminate\Support\Facades\DB;
use PDOException;

class NeonProductsReport extends Command
{
    protected $signature = 'neon:products-report {--database=pgsql_direct : Direct Neon connection to inspect read-only}';

    protected $description = 'List existing non-demo product names from Neon without changing data.';

    public function handle(): int
    {
        $connectionName = $this->option('database');
        $connectionConfig = (array) config('database.connections.'.$connectionName, []);
        $url = $connectionConfig['url'] ?? null;

        if (
            $connectionName !== 'pgsql_direct'
            || ($connectionConfig['driver'] ?? null) !== 'pgsql'
            || ! NeonDatabaseUrl::isNeonDirect(is_string($url) ? $url : null)
            || ! $this->requiresSsl($connectionConfig)
        ) {
            $this->error('Refusing to query: select a direct Neon PostgreSQL connection with sslmode=require.');

            return self::FAILURE;
        }

        try {
            $connection = DB::connection('pgsql_direct');
            $connection->getPdo();
            $schema = $connection->getSchemaBuilder();

            if (! $schema->hasTable('products')) {
                $this->error('The products table does not exist on the selected database.');

                return self::FAILURE;
            }

            $query = $connection->table('products');
            if ($schema->hasColumn('products', 'deleted_at')) {
                $query->whereNull('deleted_at');
            }
            if ($schema->hasColumn('products', 'is_demo')) {
                $query->where(function ($builder): void {
                    $builder->where('is_demo', false)->orWhereNull('is_demo');
                });
            }

            $names = $query->orderBy('name')->pluck('name');
        } catch (ConnectionException|PDOException) {
            $this->error('Read-only Neon product query failed; connection details were suppressed.');

            return self::FAILURE;
        }

        $this->line('non_demo_product_count='.$names->count());
        foreach ($names as $name) {
            $singleLineName = preg_replace('/[\r\n\t]+/', ' ', (string) $name) ?? '';
            $this->line('product_name='.$singleLineName);
        }

        return self::SUCCESS;
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
}
