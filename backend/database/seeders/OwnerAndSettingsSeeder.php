<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;
use RuntimeException;

class OwnerAndSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) config('app.owner_email'));
        $password = (string) config('app.owner_password');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            throw new InvalidArgumentException(
                'Set OWNER_EMAIL and OWNER_PASSWORD in backend/.env before seeding the owner account.'
            );
        }

        DB::transaction(function () use ($email, $password): void {
            $settings = [
                'store_name' => [
                    'group' => 'general',
                    'value' => 'Afiya Shope',
                    'type' => 'string',
                ],
                'currency' => [
                    'group' => 'general',
                    'value' => 'USD',
                    'type' => 'string',
                ],
            ];

            foreach ($settings as $key => $attributes) {
                $existingSetting = Setting::query()->where('key', $key)->first();
                if ($existingSetting && (
                    $existingSetting->group !== $attributes['group']
                    || $existingSetting->value !== $attributes['value']
                    || $existingSetting->type !== $attributes['type']
                )) {
                    throw new RuntimeException(
                        sprintf('Existing "%s" setting differs; refusing to overwrite it.', $key)
                    );
                }
            }

            $superAdminRole = Role::query()->where('slug', 'super-admin')->first();
            if (! $superAdminRole) {
                if (Role::query()->exists() || DB::table('permissions')->exists()) {
                    throw new RuntimeException(
                        'Existing role or permission data was found without a super-admin role; refusing to modify it.'
                    );
                }

                $this->call(RolePermissionSeeder::class);
                $superAdminRole = Role::query()->where('slug', 'super-admin')->firstOrFail();
            }

            $existingOwner = User::query()->where('email', $email)->first();
            if ($existingOwner && ! $existingOwner->hasRole('super-admin')) {
                throw new RuntimeException(
                    'OWNER_EMAIL is already used by a non-owner account; refusing to overwrite it.'
                );
            }

            $owner = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => 'Afiya Shope Owner',
                    'password' => Hash::make($password),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ],
            );

            $owner->roles()->syncWithoutDetaching([$superAdminRole->id]);

            foreach ($settings as $key => $attributes) {
                Setting::query()->updateOrCreate(['key' => $key], $attributes);
            }
        });
    }
}
