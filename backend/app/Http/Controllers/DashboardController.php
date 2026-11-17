<?php
namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $user = auth('api')->user();
        $base = Lead::visibleTo($user);

        $byStatus   = (clone $base)->select('status', DB::raw('count(*) as count'), DB::raw('sum(value) as total_value'))->groupBy('status')->get()->keyBy('status');
        $totalLeads = (clone $base)->count();
        $pipeline   = (clone $base)->whereNotIn('status',['closed_won','closed_lost'])->sum('value');
        $wonMonth   = (clone $base)->where('status','closed_won')->whereMonth('updated_at', now()->month)->sum('value');
        $overdue    = (clone $base)->whereNotNull('next_followup_date')->where('next_followup_date','<',now())->whereNotIn('status',['closed_won','closed_lost'])->count();

        $hotLeads = (clone $base)->where('ai_score','>=',70)->whereNotIn('status',['closed_won','closed_lost'])->with('company:id,name')->select('id','title','company_id','ai_score','ai_reason','value','status')->orderByDesc('ai_score')->limit(5)->get()->append('ai_badge');

        $leaderboard = null;
        if ($user->canManageAll()) {
            $leaderboard = User::withCount(['leads as won_count' => fn($q) => $q->where('status','closed_won')])
                ->withSum(['leads as won_value' => fn($q) => $q->where('status','closed_won')], 'value')
                ->orderByDesc('won_value')->limit(10)->get(['id','name','role']);
        }

        return response()->json([
            'summary'             => ['total_leads' => $totalLeads, 'total_pipeline' => $pipeline, 'won_this_month' => $wonMonth, 'overdue_followups' => $overdue],
            'pipeline_by_status'  => $byStatus,
            'hot_leads'           => $hotLeads,
            'leaderboard'         => $leaderboard,
        ]);
    }
}
