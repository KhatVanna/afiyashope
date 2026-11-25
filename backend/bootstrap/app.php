<?php

use App\Support\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        // Railway / reverse proxies terminate TLS in front of the container.
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            // Role/permission aliases will be registered in Phase 3.
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if (
                $request->is('api/v1/admin/site-settings*')
                || $request->is('api/v1/admin/banners*')
                || $request->is('api/v1/admin/brands*')
                || $request->is('api/v1/admin/media/site-settings')
            ) {
                return ApiResponse::error('Unauthenticated.', 401);
            }

            return null;
        });

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
