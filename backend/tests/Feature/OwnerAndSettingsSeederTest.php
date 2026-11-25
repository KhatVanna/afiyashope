<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\OwnerAndSettingsSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class OwnerAndSettingsSeederTest extends TestCase
{
    use DatabaseMigrations;

    public function test_owner_settings_command_seeds_only_owner_auth_data_and_store_settings(): void
    {
        config([
            'app.owner_email' => 'owner@example.test',
            'app.owner_password' => 'safe-test-password',
        ]);

        $this->artisan('app:seed-owner-settings')
            ->expectsConfirmation(
                'Seed required roles and permissions, one owner account, and two store settings (no products)?',
                'yes',
            )
            ->assertExitCode(0);

        $owner = User::query()->where('email', 'owner@example.test')->firstOrFail();
        $this->assertSame('Afiya Shope Owner', $owner->name);
        $this->assertTrue(Hash::check('safe-test-password', $owner->password));
        $this->assertTrue($owner->hasRole('super-admin'));
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('settings', 2);
        $this->assertDatabaseHas('settings', [
            'key' => 'store_name',
            'value' => 'Afiya Shope',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => 'currency',
            'value' => 'USD',
        ]);

        $this->artisan('app:seed-owner-settings')
            ->expectsConfirmation(
                'Seed required roles and permissions, one owner account, and two store settings (no products)?',
                'yes',
            )
            ->assertExitCode(0);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('settings', 2);
    }

    public function test_owner_settings_command_refuses_remote_database_without_allow_option(): void
    {
        $defaultConnection = config('database.default');
        $pgsqlConnection = config('database.connections.pgsql');

        config([
            'database.default' => 'pgsql',
            'database.connections.pgsql.driver' => 'pgsql',
            'database.connections.pgsql.url' => null,
            'database.connections.pgsql.host' => 'remote.example',
            'app.owner_email' => 'owner@example.test',
            'app.owner_password' => 'safe-test-password',
        ]);

        try {
            $this->artisan('app:seed-owner-settings')
                ->expectsOutput('Refusing to access a non-local database. Use --allow-remote only after separate approval.')
                ->assertExitCode(1);
        } finally {
            config([
                'database.default' => $defaultConnection,
                'database.connections.pgsql' => $pgsqlConnection,
            ]);
        }

        $this->assertDatabaseCount('users', 0);
    }

    public function test_seeder_preserves_an_existing_non_owner_account_with_the_configured_email(): void
    {
        config([
            'app.owner_email' => 'owner@example.test',
            'app.owner_password' => 'safe-test-password',
        ]);
        User::query()->create([
            'name' => 'Existing User',
            'email' => 'owner@example.test',
            'password' => 'original-password',
            'is_active' => true,
        ]);

        try {
            app(OwnerAndSettingsSeeder::class)->run();
            $this->fail('Expected the seeder to refuse an existing non-owner account.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'OWNER_EMAIL is already used by a non-owner account; refusing to overwrite it.',
                $exception->getMessage(),
            );
        }

        $this->assertDatabaseHas('users', [
            'email' => 'owner@example.test',
            'name' => 'Existing User',
        ]);
        $this->assertDatabaseCount('roles', 0);
        $this->assertDatabaseCount('permissions', 0);
        $this->assertDatabaseCount('settings', 0);
    }

    public function test_seeder_preserves_existing_store_settings_that_differ(): void
    {
        config([
            'app.owner_email' => 'owner@example.test',
            'app.owner_password' => 'safe-test-password',
        ]);
        Setting::query()->create([
            'group' => 'general',
            'key' => 'currency',
            'value' => 'KHR',
            'type' => 'string',
        ]);

        try {
            app(OwnerAndSettingsSeeder::class)->run();
            $this->fail('Expected the seeder to refuse overwriting an existing setting.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Existing "currency" setting differs; refusing to overwrite it.',
                $exception->getMessage(),
            );
        }

        $this->assertDatabaseHas('settings', [
            'key' => 'currency',
            'value' => 'KHR',
        ]);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('roles', 0);
        $this->assertDatabaseCount('permissions', 0);
    }
}
