<?php
namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function __construct() { $this->middleware('auth:api'); }

    public function index(Request $request): JsonResponse
    {
        $user = auth('api')->user();
        $companies = Company::visibleTo($user)
            ->when($request->search, fn($q,$s) => $q->where('name','like',"%{$s}%")->orWhere('website','like',"%{$s}%"))
            ->when($request->industry, fn($q,$i) => $q->where('industry',$i))
            ->withCount('leads')
            ->orderBy('name')
            ->paginate(20);
        return response()->json($companies);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:150',
            'industry' => 'required|in:tech,healthcare,finance,retail,other',
            'website'  => 'nullable|url|max:255',
            'size'     => 'nullable|in:1-10,11-50,51-200,201-1000,1000+',
        ]);
        $company = auth('api')->user()->companies()->create($data);
        return response()->json($company->load('owner'), 201);
    }

    public function show(Company $company): JsonResponse
    {
        $this->authorize('view', $company);
        return response()->json($company->load(['owner', 'leads' => fn($q) => $q->select('id','title','status','value','ai_score')]));
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $this->authorize('update', $company);
        $data = $request->validate([
            'name'     => 'sometimes|required|string|max:150',
            'industry' => 'sometimes|required|in:tech,healthcare,finance,retail,other',
            'website'  => 'nullable|url|max:255',
            'size'     => 'nullable|in:1-10,11-50,51-200,201-1000,1000+',
        ]);
        $company->update($data);
        return response()->json($company->fresh('owner'));
    }

    public function destroy(Company $company): JsonResponse
    {
        $this->authorize('delete', $company);
        $active = $company->leads()->whereNotIn('status', ['closed_won','closed_lost'])->count();
        if ($active > 0) {
            return response()->json(['message' => "Cannot delete: {$active} active lead(s) linked."], 422);
        }
        $company->delete();
        return response()->json(null, 204);
    }
}
