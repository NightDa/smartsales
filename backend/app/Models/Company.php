<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'industry', 'website', 'size', 'user_id'];

    public function owner(){ return $this->belongsTo(User::class, 'user_id'); }
    public function leads(){ return $this->hasMany(Lead::class); }

    public function scopeVisibleTo($query, User $user)
    {
        return $user->canManageAll() ? $query : $query->where('user_id', $user->id);
    }
}
