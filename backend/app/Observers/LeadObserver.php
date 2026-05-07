<?php
namespace App\Observers;

use App\Jobs\ScoreLeadJob;
use App\Models\Activity;
use App\Models\Lead;
use App\Notifications\LeadAssignedNotification;
use App\Notifications\LeadStatusChangedNotification;
use Illuminate\Support\Facades\Auth;

class LeadObserver
{
    public function created(Lead $lead): void
    {
        ScoreLeadJob::dispatch($lead)->onQueue('ai');
    }

    public function updated(Lead $lead): void
    {
        $actorId = Auth::id() ?? $lead->user_id;

        if ($lead->wasChanged('status')) {
            $old = $lead->getOriginal('status');
            $new = $lead->status;

            Activity::create(['lead_id' => $lead->id, 'user_id' => $actorId, 'type' => 'status_changed', 'content' => "Status changed from \"{$old}\" to \"{$new}\"."]);

            if ($lead->user_id && $lead->user_id !== $actorId) {
                $lead->assignedTo->notify(new LeadStatusChangedNotification($lead, $old, $new));
            }

            if (!in_array($new, ['closed_won', 'closed_lost'])) {
                ScoreLeadJob::dispatch($lead)->onQueue('ai');
            }
        }

        if ($lead->wasChanged('user_id') && $lead->user_id) {
            $lead->assignedTo->notify(new LeadAssignedNotification($lead->load('company')));
        }

        if ($lead->wasChanged('last_contact_date')) {
            ScoreLeadJob::dispatch($lead)->onQueue('ai');
        }
    }
}
