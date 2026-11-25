<?php

namespace App\Providers;

use App\Support\NeonDatabaseUrl;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $runtimeUrl = config('database.connections.pgsql.url');

        if (
            config('app.env') === 'production'
            && config('database.default') === 'pgsql'
            && NeonDatabaseUrl::isNeonDirect(is_string($runtimeUrl) ? $runtimeUrl : null)
        ) {
            Log::warning(
                'Runtime DB_URL uses a direct Neon endpoint. The app will continue with it; a pooled endpoint is recommended for runtime traffic.'
            );
        }
    }
}
