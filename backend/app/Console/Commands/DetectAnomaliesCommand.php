<?php
namespace App\Console\Commands;

use App\Models\AiPromptsLog;
use App\Models\Lead;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DetectAnomaliesCommand extends Command
{
    protected $signature   = 'leads:detect-anomalies {--stale-days=7}';
    protected $description = 'Detect stalling deals and cache AI recovery suggestions.';

    public function handle(): int
    {
        $days  = (int) $this->option('stale-days');
        $leads = Lead::whereNotIn('status', ['closed_won','closed_lost'])
            ->where(fn($q) => $q->where('last_contact_date', '<', now()->subDays($days))->orWhereNull('last_contact_date'))
            ->with('company:id,name,industry')->get();

        if ($leads->isEmpty()) { $this->info('No stalled leads.'); return self::SUCCESS; }

        $this->info("Analysing {$leads->count()} stalled leads…");
        $bar = $this->output->createProgressBar($leads->count());
        $bar->start();

        foreach ($leads as $lead) {
            try {
                $result = $this->analyse($lead);
            } catch (\Throwable $e) {
                Log::warning("Anomaly detection failed for lead #{$lead->id}: {$e->getMessage()}");
                $result = ['risk_level' => 'medium', 'suggestion' => 'Send a check-in email to re-engage.'];
            }

            Cache::put("anomaly:{$lead->id}", [
                'lead_id'      => $lead->id,
                'lead_title'   => $lead->title,
                'company'      => $lead->company->name,
                'days_stalled' => $lead->last_contact_date?->diffInDays(now()),
                'risk_level'   => $result['risk_level'],
                'suggestion'   => $result['suggestion'],
                'detected_at'  => now()->toIso8601String(),
            ], now()->addHours(12));

            $bar->advance();
        }

        $bar->finish(); $this->newLine(); $this->info('Done.');
        return self::SUCCESS;
    }

    private function analyse(Lead $lead): array
    {
        $key = config('services.openai.key');
        if (!$key) return ['risk_level' => 'medium', 'suggestion' => 'OpenAI key not configured.'];

        $days  = $lead->last_contact_date ? $lead->last_contact_date->diffInDays(now()) : 'unknown';
        $value = '$'.number_format($lead->value / 100, 2);

        $prompt = "A deal is stalling. Suggest ONE recovery action.\nDeal: {$lead->title}\nCompany: {$lead->company->name} ({$lead->company->industry})\nValue: {$value} | Status: {$lead->status} | Days stalled: {$days}\nReturn ONLY: {\"risk_level\":\"high|medium|low\",\"suggestion\":\"<one sentence>\"}";

        $res     = Http::withHeaders(['Authorization' => "Bearer {$key}"])->timeout(30)->post('https://api.openai.com/v1/chat/completions', ['model' => 'gpt-4o-mini', 'max_tokens' => 100, 'temperature' => 0.3, 'messages' => [['role' => 'system', 'content' => 'JSON only.'], ['role' => 'user', 'content' => $prompt]]]);
        $res->throw();
        $content = preg_replace('/```json|```/', '', $res->json()['choices'][0]['message']['content'] ?? '{}');
        $parsed  = json_decode(trim($content), true);

        AiPromptsLog::create(['user_id' => $lead->user_id, 'prompt_type' => 'anomaly_detection', 'prompt_text' => $prompt, 'response_text' => $content, 'tokens_used' => $res->json()['usage']['total_tokens'] ?? 0]);

        return ['risk_level' => in_array($parsed['risk_level'] ?? '', ['high','medium','low']) ? $parsed['risk_level'] : 'medium', 'suggestion' => $parsed['suggestion'] ?? 'Follow up directly.'];
    }
}
