<?php
namespace App\Jobs;

use App\Models\Lead;
use App\Models\User;
use App\Notifications\LeadAssignedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AssignLeadJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public Lead $lead) {}

    public function handle(): void
    {
        if ($this->lead->user_id !== null) return;

        $agent = User::where('role', 'agent')
            ->withCount(['leads as open_count' => fn($q) => $q->whereNotIn('status', ['closed_won','closed_lost'])])
            ->orderBy('open_count')
            ->orderBy('updated_at')
            ->first();

        if (!$agent) return;

        $this->lead->update(['user_id' => $agent->id]);
        $agent->notify(new LeadAssignedNotification($this->lead->fresh('company')));
    }
}
