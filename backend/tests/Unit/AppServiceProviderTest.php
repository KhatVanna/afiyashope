<?php

namespace Tests\Unit;

use App\Providers\AppServiceProvider;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    public function test_direct_neon_runtime_url_logs_a_sanitized_warning_without_changing_the_url(): void
    {
        $runtimeUrl = 'postgresql://ep-direct.neon.tech/database?sslmode=require';
        config([
            'app.env' => 'production',
            'database.default' => 'pgsql',
            'database.connections.pgsql.url' => $runtimeUrl,
        ]);
        Log::shouldReceive('warning')
            ->once()
            ->with('Runtime DB_URL uses a direct Neon endpoint. The app will continue with it; a pooled endpoint is recommended for runtime traffic.');

        (new AppServiceProvider($this->app))->boot();

        $this->assertSame($runtimeUrl, config('database.connections.pgsql.url'));
    }

    public function test_pooled_neon_runtime_url_does_not_log_a_direct_endpoint_warning(): void
    {
        config([
            'app.env' => 'production',
            'database.default' => 'pgsql',
            'database.connections.pgsql.url' => 'postgresql://ep-pooler.neon.tech/database?sslmode=require',
        ]);
        Log::shouldReceive('warning')->never();

        (new AppServiceProvider($this->app))->boot();
    }
}
