<?php
namespace App\Console\Commands;

use App\Jobs\ScoreLeadJob;
use App\Models\Lead;
use Illuminate\Console\Command;

class ScoreLeadsCommand extends Command
{
    protected $signature   = 'leads:score {--limit=500} {--stale=24} {--force}';
    protected $description = 'Dispatch AI scoring jobs for open leads (runs nightly).';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $stale = (int) $this->option('stale');
        $force = $this->option('force');

        $query = Lead::whereNotIn('status', ['closed_won','closed_lost']);
        if (!$force) {
            $query->where(function ($q) use ($stale) {
                $q->whereNull('ai_score')->orWhere('updated_at', '<', now()->subHours($stale));
            });
        }

        $leads = $query->limit($limit)->get(['id']);
        if ($leads->isEmpty()) { $this->info('No leads need scoring.'); return self::SUCCESS; }

        $this->info("Dispatching {$leads->count()} scoring jobs…");
        $bar = $this->output->createProgressBar($leads->count());
        $bar->start();
        foreach ($leads as $lead) { ScoreLeadJob::dispatch($lead)->onQueue('ai'); $bar->advance(); }
        $bar->finish();
        $this->newLine();
        $this->info('Done.');
        return self::SUCCESS;
    }
}
