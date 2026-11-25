<?php

namespace Tests\Unit;

use App\Support\DatabaseTargetGuard;
use Tests\TestCase;

class DatabaseTargetGuardTest extends TestCase
{
    public function test_sqlite_database_is_local(): void
    {
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.driver' => 'sqlite',
        ]);

        $this->assertFalse(DatabaseTargetGuard::isRemote());
    }

    public function test_non_loopback_database_is_remote(): void
    {
        config([
            'database.default' => 'pgsql',
            'database.connections.pgsql.driver' => 'pgsql',
            'database.connections.pgsql.url' => null,
            'database.connections.pgsql.host' => 'remote.example',
        ]);

        $this->assertTrue(DatabaseTargetGuard::isRemote());
    }
}
