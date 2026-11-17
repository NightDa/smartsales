<?php
namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AnomalyController extends Controller
{
    public function index(): JsonResponse
    {
        $user    = auth('api')->user();
        $leadIds = Lead::visibleTo($user)->whereNotIn('status',['closed_won','closed_lost'])->pluck('id');

        $anomalies = $leadIds->map(fn($id) => Cache::get("anomaly:{$id}"))->filter()->sortByDesc(fn($a) => match($a['risk_level']){'high'=>3,'medium'=>2,default=>1})->values();

        return response()->json(['anomalies' => $anomalies, 'total' => $anomalies->count()]);
    }
}
