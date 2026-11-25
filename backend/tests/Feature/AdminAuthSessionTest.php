<?php

namespace Tests\Feature;

use App\Models\AdminRefreshSession;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AdminAuthSessionTest extends TestCase
{
    use DatabaseMigrations;

    public function test_admin_access_token_remains_valid_across_requests_and_new_logins(): void
    {
        $admin = $this->userWithRole('admin');
        $firstLogin = $this->loginAdmin($admin);
        $firstToken = $firstLogin['token'];
        $secondLogin = $this->loginAdmin($admin);

        $this->assertNotNull(PersonalAccessToken::findToken($firstToken));
        $this->assertNotSame($firstToken, $secondLogin['token']);

        $this->withToken($firstToken)->getJson('/api/v1/auth/me')->assertOk();
        $this->withToken($firstToken)->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_expired_admin_access_token_can_be_refreshed_once(): void
    {
        $admin = $this->userWithRole('admin');
        $login = $this->loginAdmin($admin);
        $accessToken = $login['token'];
        $refreshToken = $login['refresh_token'];

        $accessRecord = PersonalAccessToken::findToken($accessToken);
        $this->assertNotNull($accessRecord);
        $accessRecord->forceFill(['expires_at' => now()->subMinute()])->save();

        $this->withToken($accessToken)->getJson('/api/v1/auth/me')->assertUnauthorized();

        $refresh = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $refreshToken,
        ])->assertOk();
        $newAccessToken = $refresh->json('data.token');
        $newRefreshToken = $refresh->json('data.refresh_token');

        $this->assertNotSame($accessToken, $newAccessToken);
        $this->assertNotSame($refreshToken, $newRefreshToken);
        $this->withToken($newAccessToken)->getJson('/api/v1/auth/me')->assertOk();
        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $refreshToken,
        ])->assertUnauthorized();
    }

    public function test_invalid_access_and_refresh_sessions_are_rejected(): void
    {
        $this->withToken('invalid-access-token')
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();

        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => 'invalid-refresh-token',
        ])->assertUnauthorized();

        $login = $this->loginAdmin($this->userWithRole('admin'));
        AdminRefreshSession::query()
            ->where('token_hash', hash('sha256', $login['refresh_token']))
            ->update(['expires_at' => now()->subMinute()]);

        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $login['refresh_token'],
        ])->assertUnauthorized();
    }

    public function test_admin_logout_revokes_access_and_refresh_sessions(): void
    {
        $admin = $this->userWithRole('admin');
        $login = $this->loginAdmin($admin);
        $accessToken = $login['token'];
        $refreshToken = $login['refresh_token'];
        $accessRecord = PersonalAccessToken::findToken($accessToken);

        $this->postJson('/api/v1/auth/admin-logout', [
            'refresh_token' => $refreshToken,
        ], [
            'Authorization' => 'Bearer '.$accessToken,
        ])->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $accessRecord->id]);
        $this->withToken($accessToken)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $refreshToken,
        ])->assertUnauthorized();
    }

    /**
     * @return array<string, mixed>
     */
    private function loginAdmin(User $admin): array
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
            'portal' => 'admin',
        ])->assertOk()->json('data');
    }

    private function userWithRole(string $slug): User
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => $slug],
            ['name' => ucfirst($slug), 'description' => 'Test role'],
        );
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }
}
