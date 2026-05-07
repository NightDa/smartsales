<?php
namespace App\Http\Controllers;

use App\Models\AiPromptsLog;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    public function __construct() { $this->middleware('auth:api'); }

    public function filterBuilder(Request $request): JsonResponse
    {
        $request->validate(['query' => 'required|string|max:300']);
        $q = $request->input('query');

        $prompt = <<<PROMPT
Convert this natural language sales query into a JSON filter object.

Valid keys and values:
- "status": new|contacted|qualified|proposal|negotiation|closed_won|closed_lost
- "priority": high|medium|low
- "search": any string
- "overdue": true
- "min_value": integer in cents
- "max_value": integer in cents

Query: "{$q}"

Rules: only include clearly mentioned keys. Dollar amounts → cents. If nothing maps return {}.
Return ONLY valid JSON, no explanation, no markdown.
PROMPT;

        [$filters, $tokens] = $this->callOpenAI($prompt, 150);

        AiPromptsLog::create(['user_id' => auth('api')->id(), 'prompt_type' => 'filter_builder', 'prompt_text' => $prompt, 'response_text' => json_encode($filters), 'tokens_used' => $tokens]);

        return response()->json(['filters' => $filters ?? new \stdClass(), 'original_query' => $q]);
    }

    public function generateReply(Lead $lead): JsonResponse
    {
        $this->authorize('view', $lead);
        $lead->load(['company', 'activities' => fn($q) => $q->latest()->limit(5)]);

        $activities = $lead->activities->map(fn($a) => "[{$a->type}] {$a->content}")->join("\n");
        $value      = '$'.number_format($lead->value / 100, 2);

        $prompt = <<<PROMPT
Write a professional sales follow-up email body.

Lead: {$lead->contact_name} at {$lead->company->name} ({$lead->company->industry})
Value: {$value} | Status: {$lead->status} | Priority: {$lead->priority}
Recent interactions:
{$activities}

Guidelines:
- First name only, 3-4 short paragraphs
- Reference one detail from interactions if available
- Exactly ONE clear next step or question
- No "I hope this finds you well" clichés
- Confident, human tone
- No subject line — body only
PROMPT;

        [$reply, $tokens] = $this->callOpenAI($prompt, 400, 0.7);

        AiPromptsLog::create(['user_id' => auth('api')->id(), 'prompt_type' => 'reply_generation', 'prompt_text' => $prompt, 'response_text' => $reply, 'tokens_used' => $tokens]);

        return response()->json(['reply' => is_string($reply) ? $reply : json_encode($reply)]);
    }

    public function suggestSubject(Lead $lead): JsonResponse
    {
        $this->authorize('view', $lead);
        $lead->load('company');

        $prompt = "Write 3 short, natural email subject lines for a sales follow-up to {$lead->contact_name} at {$lead->company->name} about \"{$lead->title}\". Return ONLY a JSON array of 3 strings, no markdown.";

        [$subjects, $tokens] = $this->callOpenAI($prompt, 80);

        return response()->json(['subjects' => is_array($subjects) ? $subjects : []]);
    }

    private function callOpenAI(string $prompt, int $maxTokens = 300, float $temperature = 0.2): array
    {
        $apiKey = config('services.openai.key');

        if (!$apiKey) {
            return [['error' => 'OPENAI_API_KEY not set'], 0];
        }

        $response = Http::withHeaders(['Authorization' => "Bearer {$apiKey}"])
            ->timeout(30)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model'       => 'gpt-4o-mini',
                'max_tokens'  => $maxTokens,
                'temperature' => $temperature,
                'messages'    => [
                    ['role' => 'system', 'content' => 'Follow instructions precisely. For JSON-only tasks output raw JSON with no markdown.'],
                    ['role' => 'user',   'content' => $prompt],
                ],
            ]);

        $response->throw();

        $body    = $response->json();
        $content = $body['choices'][0]['message']['content'] ?? '';
        $tokens  = $body['usage']['total_tokens'] ?? 0;
        $clean   = preg_replace('/```json|```/', '', $content);
        $decoded = json_decode(trim($clean), true);

        return [$decoded ?? trim($content), $tokens];
    }
}
