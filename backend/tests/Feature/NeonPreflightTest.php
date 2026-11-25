<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class NeonPreflightTest extends TestCase
{
    use DatabaseMigrations;

    public function test_preflight_reports_read_only_checks_without_connecting_to_neon_in_tests(): void
    {
        config([
            'database.connections.pgsql.driver' => 'pgsql',
            'database.connections.pgsql.url' => 'postgresql://ep-pool.neon.tech/app?sslmode=require',
            'database.connections.pgsql_direct.driver' => 'pgsql',
            'database.connections.pgsql_direct.url' => 'postgresql://ep-direct.neon.tech/app?sslmode=require',
            'app.owner_email' => 'owner@example.test',
        ]);
        User::query()->create([
            'name' => 'Test Owner',
            'email' => 'owner@example.test',
            'password' => 'test-password',
            'is_active' => true,
        ]);

        $this->useSqliteForPreflightProbe();

        $this->artisan('neon:preflight', ['--database' => 'pgsql_direct'])
            ->expectsOutput('direct_connection_configured=true')
            ->expectsOutput('sslmode_require=true')
            ->expectsOutput('target_not_local=true')
            ->expectsOutput('target_is_neon=true')
            ->expectsOutput('connection_can_connect=true')
            ->expectsOutput('roles_table_empty=true')
            ->expectsOutput('permissions_table_empty=true')
            ->expectsOutput('owner_email_exists=true')
            ->assertExitCode(0);
    }

    public function test_preflight_refuses_a_local_target_without_connecting(): void
    {
        config([
            'database.connections.pgsql.driver' => 'pgsql',
            'database.connections.pgsql.url' => 'postgresql://127.0.0.1/app?sslmode=require',
            'database.connections.pgsql_direct.driver' => 'pgsql',
            'database.connections.pgsql_direct.url' => 'postgresql://127.0.0.1/app?sslmode=require',
        ]);
        $this->useSqliteForPreflightProbe();

        $this->artisan('neon:preflight', ['--database' => 'pgsql_direct'])
            ->expectsOutput('direct_connection_configured=true')
            ->expectsOutput('sslmode_require=true')
            ->expectsOutput('target_not_local=false')
            ->expectsOutput('target_is_neon=false')
            ->expectsOutput('connection_can_connect=false')
            ->expectsOutput('roles_table_empty=false')
            ->expectsOutput('permissions_table_empty=false')
            ->expectsOutput('owner_email_exists=false')
            ->assertExitCode(1);
    }

    public function test_preflight_refuses_a_pooled_direct_connection_without_connecting(): void
    {
        config([
            'database.connections.pgsql_direct.driver' => 'pgsql',
            'database.connections.pgsql_direct.url' => 'postgresql://ep-pooler.neon.tech/app?sslmode=require',
        ]);

        $this->artisan('neon:preflight', ['--database' => 'pgsql_direct'])
            ->expectsOutput('direct_connection_configured=false')
            ->expectsOutput('sslmode_require=false')
            ->expectsOutput('target_not_local=false')
            ->expectsOutput('target_is_neon=false')
            ->expectsOutput('connection_can_connect=false')
            ->expectsOutput('roles_table_empty=false')
            ->expectsOutput('permissions_table_empty=false')
            ->expectsOutput('owner_email_exists=false')
            ->assertExitCode(1);
    }

    private function useSqliteForPreflightProbe(): void
    {
        $database = app('db');
        $testConnection = $database->connection('sqlite');
        $database->extend('pgsql', fn () => $testConnection);
    }
}
