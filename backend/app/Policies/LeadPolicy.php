<?php
namespace App\Policies;
use App\Models\Lead;
use App\Models\User;

class LeadPolicy {
    public function view(User $u, Lead $l): bool   { return $u->canManageAll() || $l->user_id === $u->id; }
    public function update(User $u, Lead $l): bool { return $u->canManageAll() || $l->user_id === $u->id; }
    public function delete(User $u, Lead $l): bool { return $u->canManageAll() || $l->user_id === $u->id; }
}
