<?php
namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeadAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Lead $lead) {}
    public function via(object $n): array { return ['mail', 'database']; }

    public function toMail(object $n): MailMessage
    {
        $value = '$'.number_format($this->lead->value / 100, 2);
        return (new MailMessage)->subject("New lead assigned: {$this->lead->title}")->greeting("Hi {$n->name},")->line("A new lead has been assigned to you.")->line("**{$this->lead->title}** — {$value}")->action('View Lead', url("/leads/{$this->lead->id}"));
    }

    public function toDatabase(object $n): array
    {
        return ['type' => 'lead_assigned', 'lead_id' => $this->lead->id, 'title' => $this->lead->title, 'message' => "New lead assigned: {$this->lead->title}"];
    }
}
