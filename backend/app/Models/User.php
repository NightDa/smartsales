<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role'];
    protected $hidden   = ['password', 'remember_token'];
    protected $casts    = ['password' => 'hashed'];

    // JWT
    public function getJWTIdentifier(): mixed { return $this->getKey(); }
    public function getJWTCustomClaims(): array { return ['role' => $this->role, 'name' => $this->name]; }

    // Role helpers
    public function isAdmin(): bool       { return $this->role === 'admin'; }
    public function isSalesManager(): bool{ return $this->role === 'sales_manager'; }
    public function isAgent(): bool       { return $this->role === 'agent'; }
    public function canManageAll(): bool  { return in_array($this->role, ['admin', 'sales_manager']); }

    // Relationships
    public function companies(){ return $this->hasMany(Company::class); }
    public function leads()    { return $this->hasMany(Lead::class); }
    public function activities(){ return $this->hasMany(Activity::class); }
}
