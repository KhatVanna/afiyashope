<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    private const MANAGEMENT_ROLES = ['super-admin', 'admin'];

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(self::MANAGEMENT_ROLES);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(self::MANAGEMENT_ROLES);
    }

    public function update(User $user, Category $category): bool
    {
        return $user->hasAnyRole(self::MANAGEMENT_ROLES);
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->hasAnyRole(self::MANAGEMENT_ROLES);
    }
}
