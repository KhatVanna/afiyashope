<?php

namespace Tests\Unit;

use App\Support\NeonDatabaseUrl;
use PHPUnit\Framework\TestCase;

class NeonDatabaseUrlTest extends TestCase
{
    public function test_migration_url_prefers_explicit_direct_url(): void
    {
        $directUrl = 'postgresql://direct.example.test/database?sslmode=require';
        $runtimeUrl = 'postgresql://pooler.example.test/database?sslmode=require';

        $this->assertSame(
            $directUrl,
            NeonDatabaseUrl::resolveMigrationUrl($directUrl, $runtimeUrl),
        );
    }

    public function test_migration_url_falls_back_to_a_non_pooler_runtime_url(): void
    {
        $runtimeUrl = 'postgresql://ep-direct.neon.tech/database?sslmode=require';

        $this->assertSame(
            $runtimeUrl,
            NeonDatabaseUrl::resolveMigrationUrl(null, $runtimeUrl),
        );
    }

    public function test_migration_url_does_not_infer_a_direct_url_from_a_pooler(): void
    {
        $runtimeUrl = 'postgresql://ep-example-pooler.neon.tech/database?sslmode=require';

        $this->assertNull(NeonDatabaseUrl::resolveMigrationUrl('', $runtimeUrl));
    }
}
