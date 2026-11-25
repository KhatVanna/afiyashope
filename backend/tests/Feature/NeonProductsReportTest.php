<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NeonProductsReportTest extends TestCase
{
    use DatabaseMigrations;

    public function test_report_lists_only_non_demo_products_without_connecting_to_neon_in_tests(): void
    {
        config([
            'database.connections.pgsql_direct.driver' => 'pgsql',
            'database.connections.pgsql_direct.url' => 'postgresql://ep-direct.neon.tech/app?sslmode=require',
        ]);
        DB::table('products')->insert([
            [
                'name' => 'Existing Abaya',
                'slug' => 'existing-abaya',
                'sku' => 'TEST-001',
                'price' => 450,
                'is_demo' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Example Demo',
                'slug' => 'example-demo',
                'sku' => 'TEST-002',
                'price' => 450,
                'is_demo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
        $this->useSqliteForNeonProbe();

        $this->artisan('neon:products-report', ['--database' => 'pgsql_direct'])
            ->expectsOutput('non_demo_product_count=1')
            ->expectsOutput('product_name=Existing Abaya')
            ->assertExitCode(0);
    }

    public function test_report_refuses_a_pooled_connection_without_connecting(): void
    {
        config([
            'database.connections.pgsql_direct.driver' => 'pgsql',
            'database.connections.pgsql_direct.url' => 'postgresql://ep-pooler.neon.tech/app?sslmode=require',
        ]);

        $this->artisan('neon:products-report', ['--database' => 'pgsql_direct'])
            ->expectsOutput('Refusing to query: select a direct Neon PostgreSQL connection with sslmode=require.')
            ->assertExitCode(1);
    }

    private function useSqliteForNeonProbe(): void
    {
        $database = app('db');
        $testConnection = $database->connection('sqlite');
        $database->extend('pgsql', fn () => $testConnection);
    }
}
