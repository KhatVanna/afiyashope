<?php

namespace App\Providers;

use App\Models\Brand;
use App\Models\Category;
use App\Policies\BrandPolicy;
use App\Policies\CategoryPolicy;
use App\Support\DatabaseCommandGuard;
use App\Support\NeonDatabaseUrl;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
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
        Gate::policy(Brand::class, BrandPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);

        if ($this->app->runningInConsole()) {
            Event::listen(CommandStarting::class, static function (CommandStarting $event): void {
                if (! DatabaseCommandGuard::isDatabaseCommand($event->command)) {
                    return;
                }

                $option = $event->input->getParameterOption('--database');
                $connectionName = is_string($option) && $option !== '' ? $option : null;

                DatabaseCommandGuard::assertSafe($event->command, $connectionName);
            });
        }

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
