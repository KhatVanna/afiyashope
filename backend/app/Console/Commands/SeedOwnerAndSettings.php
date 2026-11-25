<?php

namespace App\Console\Commands;

use App\Support\DatabaseTargetGuard;
use Database\Seeders\OwnerAndSettingsSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class SeedOwnerAndSettings extends Command
{
    protected $signature = 'app:seed-owner-settings
                            {--allow-remote : Permit a non-local database after a separate approval}';

    protected $description = 'Seed only the owner account, required roles/permissions, and store settings.';

    public function handle(): int
    {
        if (DatabaseTargetGuard::isRemote() && ! $this->option('allow-remote')) {
            $this->error('Refusing to access a non-local database. Use --allow-remote only after separate approval.');

            return self::FAILURE;
        }

        $email = trim((string) config('app.owner_email'));
        $password = (string) config('app.owner_password');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            $this->error('Set OWNER_EMAIL and OWNER_PASSWORD in backend/.env before running this command.');

            return self::FAILURE;
        }

        if (! $this->confirm(
            'Seed required roles and permissions, one owner account, and two store settings (no products)?',
            false,
        )) {
            $this->info('Cancelled; no database records were changed.');

            return self::SUCCESS;
        }

        $result = Artisan::call('db:seed', [
            '--class' => OwnerAndSettingsSeeder::class,
            '--force' => true,
        ]);

        if ($result !== self::SUCCESS) {
            $this->error('Owner and settings seeding failed.');

            return $result;
        }

        $this->info('Seeded the owner, required roles/permissions, and two settings; no products were seeded.');

        return self::SUCCESS;
    }
}
