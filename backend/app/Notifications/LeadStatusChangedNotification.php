<?php
namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeadStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Lead $lead, public string $oldStatus, public string $newStatus) {}
    public function via(object $n): array { return ['mail', 'database']; }

    public function toMail(object $n): MailMessage
    {
        $emoji = match($this->newStatus) { 'closed_won' => '🎉', 'closed_lost' => '😔', default => '🔄' };
        return (new MailMessage)->subject("{$emoji} Lead status updated: {$this->lead->title}")->greeting("Hi {$n->name},")->line("**{$this->lead->title}**: {$this->oldStatus} → **{$this->newStatus}**")->action('View Lead', url("/leads/{$this->lead->id}"));
    }

    public function toDatabase(object $n): array
    {
        return ['type' => 'status_changed', 'lead_id' => $this->lead->id, 'title' => $this->lead->title, 'old_status' => $this->oldStatus, 'new_status' => $this->newStatus, 'message' => "Lead \"{$this->lead->title}\" moved to {$this->newStatus}."];
    }
}
