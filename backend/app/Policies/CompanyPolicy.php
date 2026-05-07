<?php
namespace App\Policies;
use App\Models\Company;
use App\Models\User;

class CompanyPolicy {
    public function view(User $u, Company $c): bool   { return $u->canManageAll() || $c->user_id === $u->id; }
    public function update(User $u, Company $c): bool { return $u->canManageAll() || $c->user_id === $u->id; }
    public function delete(User $u, Company $c): bool { return $u->isAdmin()      || $c->user_id === $u->id; }
}
