<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\AdminRefreshSession;
use App\Models\Role;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /** @var list<string> */
    private const STORE_ROLES = ['customer'];

    /** @var list<string> */
    private const ADMIN_ROLES = ['super-admin', 'admin', 'staff'];

    private const ADMIN_ACCESS_TOKEN_TTL_MINUTES = 15;

    private const ADMIN_REFRESH_TOKEN_TTL_DAYS = 30;

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
            'phone' => $request->input('phone'),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $customerRole = Role::query()->where('slug', 'customer')->first();
        if ($customerRole) {
            $user->roles()->sync([$customerRole->id]);
        }

        $token = $user->createToken('user-frontend')->plainTextToken;

        return ApiResponse::success([
            'user' => new UserResource($user->load('roles')),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Registration successful', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $portal = $request->string('portal')->toString();
        $allowedRoles = $portal === 'admin' ? self::ADMIN_ROLES : self::STORE_ROLES;

        if (! $user->hasAnyRole($allowedRoles)) {
            throw ValidationException::withMessages([
                'email' => [
                    $portal === 'admin'
                        ? 'Only Super Admin, Admin, or Staff accounts can sign in here.'
                        : 'Only customer accounts can sign in to the store.',
                ],
            ]);
        }

        $tokenName = $portal === 'admin' ? 'admin-frontend' : 'user-frontend';
        if ($portal === 'admin') {
            $token = $user->createToken(
                $tokenName,
                ['*'],
                now()->addMinutes(self::ADMIN_ACCESS_TOKEN_TTL_MINUTES),
            )->plainTextToken;
            $refreshToken = $this->createAdminRefreshSession($user);
        } else {
            $user->tokens()->where('name', $tokenName)->delete();
            $token = $user->createToken($tokenName)->plainTextToken;
            $refreshToken = null;
        }

        $data = [
            'user' => new UserResource($user->load('roles')),
            'token' => $token,
            'token_type' => 'Bearer',
        ];

        if ($refreshToken !== null) {
            $data['refresh_token'] = $refreshToken;
        }

        return ApiResponse::success($data, 'Login successful');
    }

    public function refresh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refresh_token' => ['required', 'string', 'max:200'],
        ]);
        $refreshToken = $validated['refresh_token'];

        $credentials = DB::transaction(function () use ($refreshToken): ?array {
            $session = AdminRefreshSession::query()
                ->where('token_hash', hash('sha256', $refreshToken))
                ->lockForUpdate()
                ->first();

            if (! $session || $session->expires_at->isPast()) {
                $session?->delete();

                return null;
            }

            $user = $session->user()->with('roles')->first();
            if (! $user || ! $user->is_active || ! $user->hasAnyRole(self::ADMIN_ROLES)) {
                $session->delete();

                return null;
            }

            $session->delete();
            $user->tokens()
                ->where('name', 'admin-frontend')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now())
                ->delete();

            return [
                'user' => new UserResource($user->load('roles')),
                'token' => $user->createToken(
                    'admin-frontend',
                    ['*'],
                    now()->addMinutes(self::ADMIN_ACCESS_TOKEN_TTL_MINUTES),
                )->plainTextToken,
                'refresh_token' => $this->createAdminRefreshSession($user),
                'token_type' => 'Bearer',
            ];
        });

        if ($credentials === null) {
            return ApiResponse::error('Invalid or expired refresh session.', 401);
        }

        return ApiResponse::success($credentials, 'Admin session refreshed');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success([
            'user' => new UserResource($request->user()->load('roles')),
        ], 'Authenticated user retrieved');
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return ApiResponse::success(null, 'Logged out successfully');
    }

    public function adminLogout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refresh_token' => ['required', 'string', 'max:200'],
        ]);

        DB::transaction(function () use ($request, $validated): void {
            AdminRefreshSession::query()
                ->where('token_hash', hash('sha256', $validated['refresh_token']))
                ->delete();

            $plainToken = $request->bearerToken();
            if ($plainToken === null) {
                return;
            }

            $token = PersonalAccessToken::findToken($plainToken);
            if ($token?->name === 'admin-frontend') {
                $token->delete();
            }
        });

        return ApiResponse::success(null, 'Logged out successfully');
    }

    private function createAdminRefreshSession(User $user): string
    {
        $plainToken = Str::random(80);

        AdminRefreshSession::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addDays(self::ADMIN_REFRESH_TOKEN_TTL_DAYS),
        ]);

        return $plainToken;
    }
}
