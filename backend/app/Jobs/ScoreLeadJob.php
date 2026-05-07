<?php
namespace App\Jobs;

use App\Models\AiPromptsLog;
use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ScoreLeadJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public Lead $lead) {}

    public function handle(): void
    {
        $this->lead->refresh()->load(['company', 'activities']);
        if (in_array($this->lead->status, ['closed_won', 'closed_lost'])) return;

        $prompt = $this->buildPrompt($this->lead);

        try {
            [$score, $reason, $tokens] = $this->callOpenAI($prompt);
        } catch (\Throwable $e) {
            Log::error("ScoreLeadJob failed for lead #{$this->lead->id}: {$e->getMessage()}");
            $score  = $this->heuristicScore($this->lead);
            $reason = 'Heuristic score (AI unavailable).';
            $tokens = 0;
        }

        $this->lead->update(['ai_score' => $score, 'ai_reason' => $reason]);

        AiPromptsLog::create(['user_id' => $this->lead->user_id, 'prompt_type' => 'scoring', 'prompt_text' => $prompt, 'response_text' => json_encode(['score' => $score, 'reason' => $reason]), 'tokens_used' => $tokens]);
    }

    private function buildPrompt(Lead $lead): string
    {
        $days  = $lead->last_contact_date ? $lead->last_contact_date->diffInDays(now()) : 'unknown';
        $value = '$'.number_format($lead->value / 100, 2);
        $acts  = $lead->activities->groupBy('type')->map->count()->toJson();

        return <<<PROMPT
Score this lead 0-100 (100=ready to close, 0=dead cold).
- Company: {$lead->company->name} ({$lead->company->industry}, {$lead->company->size})
- Value: {$value} | Status: {$lead->status} | Priority: {$lead->priority}
- Days since last contact: {$days}
- Activities: {$acts}
- Follow-up overdue: {$this->bool($lead->next_followup_date?->isPast())}
Return ONLY: {"score": <0-100>, "reason": "<one sentence>"}
PROMPT;
    }

    private function callOpenAI(string $prompt): array
    {
        $key = config('services.openai.key');
        if (!$key) return [$this->heuristicScore($this->lead), 'No API key configured.', 0];

        $res  = Http::withHeaders(['Authorization' => "Bearer {$key}"])->timeout(30)->post('https://api.openai.com/v1/chat/completions', ['model' => 'gpt-4o-mini', 'max_tokens' => 120, 'temperature' => 0.2, 'messages' => [['role' => 'system', 'content' => 'JSON only.'], ['role' => 'user', 'content' => $prompt]]]);
        $res->throw();
        $body    = $res->json();
        $content = preg_replace('/```json|```/', '', $body['choices'][0]['message']['content'] ?? '{}');
        $parsed  = json_decode(trim($content), true);
        if (!isset($parsed['score'], $parsed['reason'])) throw new \RuntimeException("Bad response: {$content}");
        return [max(0, min(100, (int)$parsed['score'])), (string)$parsed['reason'], $body['usage']['total_tokens'] ?? 0];
    }

    private function heuristicScore(Lead $lead): int
    {
        $s = 50;
        if ($lead->value > 1_000_000) $s += 20; elseif ($lead->value > 100_000) $s += 10;
        $s += match($lead->priority) {'high' => 15, 'low' => -10, default => 0};
        $days = $lead->last_contact_date?->diffInDays(now()) ?? 30;
        $s -= min(30, (int)($days / 3));
        return max(0, min(100, $s));
    }

    private function bool(mixed $v): string { return $v ? 'yes' : 'no'; }
}
