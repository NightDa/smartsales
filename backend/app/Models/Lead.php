<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'title','company_id','contact_name','contact_email','contact_phone',
        'value','status','priority','last_contact_date','next_followup_date',
        'notes','ai_score','ai_reason','user_id',
    ];

    protected $casts = [
        'last_contact_date'  => 'date',
        'next_followup_date' => 'date',
        'value'              => 'integer',
        'ai_score'           => 'integer',
    ];

    public function company()    { return $this->belongsTo(Company::class); }
    public function assignedTo() { return $this->belongsTo(User::class, 'user_id'); }
    public function activities() { return $this->hasMany(Activity::class)->latest(); }
    public function attachments(){ return $this->hasMany(Attachment::class); }

    public function scopeVisibleTo($query, User $user)
    {
        return $user->canManageAll() ? $query : $query->where('user_id', $user->id);
    }

    public function scopeFilter($query, array $filters)
    {
        if (!empty($filters['status']))   $query->where('status', $filters['status']);
        if (!empty($filters['priority'])) $query->where('priority', $filters['priority']);
        if (!empty($filters['user_id']))  $query->where('user_id', $filters['user_id']);

        if (!empty($filters['search'])) {
            $t = $filters['search'];
            $query->where(function ($q) use ($t) {
                $q->where('title', 'like', "%{$t}%")
                  ->orWhere('contact_name', 'like', "%{$t}%")
                  ->orWhere('contact_email', 'like', "%{$t}%")
                  ->orWhereHas('company', fn($c) => $c->where('name', 'like', "%{$t}%"));
            });
        }

        if (!empty($filters['overdue'])) {
            $query->whereNotNull('next_followup_date')->where('next_followup_date', '<', now());
        }

        if (!empty($filters['min_value'])) $query->where('value', '>=', $filters['min_value']);
        if (!empty($filters['max_value'])) $query->where('value', '<=', $filters['max_value']);

        return $query;
    }

    public function getAiBadgeAttribute(): string
    {
        if ($this->ai_score === null) return 'unscored';
        if ($this->ai_score >= 70)   return 'hot';
        if ($this->ai_score >= 30)   return 'warm';
        return 'cold';
    }

    public function getValueInDollarsAttribute(): float { return $this->value / 100; }
    public function getDaysSinceContactAttribute(): ?int { return $this->last_contact_date?->diffInDays(now()); }
}
