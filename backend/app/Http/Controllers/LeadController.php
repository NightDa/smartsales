<?php
namespace App\Http\Controllers;

use App\Jobs\ScoreLeadJob;
use App\Models\Activity;
use App\Models\Attachment;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = auth('api')->user();
        $leads = Lead::visibleTo($user)
            ->filter($request->only(['status','priority','user_id','search','overdue','min_value','max_value']))
            ->with(['company:id,name,industry', 'assignedTo:id,name'])
            ->orderBy($request->sort_by ?? 'created_at', $request->sort_dir ?? 'desc')
            ->paginate(25);

        $leads->getCollection()->transform(fn($l) => $l->append(['ai_badge','days_since_contact']));
        return response()->json($leads);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);
        $lead = DB::transaction(function () use ($data) {
            $lead = Lead::create($data);
            Activity::create(['lead_id' => $lead->id, 'user_id' => auth('api')->id(), 'type' => 'note_added', 'content' => 'Lead created.']);
            return $lead;
        });
        ScoreLeadJob::dispatch($lead)->onQueue('ai');
        return response()->json($lead->load(['company','assignedTo','activities']), 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        $this->authorize('view', $lead);
        $lead->load(['company','assignedTo:id,name,email','activities.user:id,name','attachments'])->append(['ai_badge','days_since_contact','value_in_dollars']);
        return response()->json($lead);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);
        $oldStatus = $lead->status;
        $data = $this->validatedData($request, $lead);

        DB::transaction(function () use ($lead, $data, $oldStatus) {
            $lead->update($data);
            if (isset($data['status']) && $data['status'] !== $oldStatus) {
                Activity::create(['lead_id' => $lead->id, 'user_id' => auth('api')->id(), 'type' => 'status_changed', 'content' => "Status changed from {$oldStatus} to {$data['status']}."]);
                if (!in_array($data['status'], ['closed_won','closed_lost'])) {
                    ScoreLeadJob::dispatch($lead->fresh())->onQueue('ai');
                }
            }
        });

        return response()->json($lead->fresh(['company','assignedTo'])->append(['ai_badge']));
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $this->authorize('delete', $lead);
        foreach ($lead->attachments as $att) Storage::delete($att->path);
        $lead->delete();
        return response()->json(null, 204);
    }

    public function addActivity(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);
        $data = $request->validate(['type' => 'required|in:email_sent,call_made,meeting_scheduled,note_added', 'content' => 'required|string|max:2000']);
        $activity = $lead->activities()->create(['user_id' => auth('api')->id(), ...$data]);
        if (in_array($data['type'], ['email_sent','call_made','meeting_scheduled'])) {
            $lead->update(['last_contact_date' => now()->toDateString()]);
        }
        return response()->json($activity->load('user:id,name'), 201);
    }

    public function uploadAttachment(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);
        $request->validate(['file' => 'required|file|max:10240|mimes:pdf,doc,docx,xls,xlsx,png,jpg,jpeg']);
        $file = $request->file('file');
        $path = $file->store("leads/{$lead->id}/attachments", 'local');
        $att  = Attachment::create(['lead_id' => $lead->id, 'user_id' => auth('api')->id(), 'filename' => $file->getClientOriginalName(), 'path' => $path, 'mime_type' => $file->getMimeType(), 'size' => $file->getSize()]);
        return response()->json($att, 201);
    }

    public function deleteAttachment(Lead $lead, Attachment $attachment): JsonResponse
    {
        $this->authorize('update', $lead);
        abort_if($attachment->lead_id !== $lead->id, 404);
        Storage::delete($attachment->path);
        $attachment->delete();
        return response()->json(null, 204);
    }

    private function validatedData(Request $request, ?Lead $lead = null): array
    {
        $rules = [
            'title'              => 'sometimes|required|string|max:200',
            'company_id'         => 'sometimes|required|exists:companies,id',
            'contact_name'       => 'sometimes|required|string|max:100',
            'contact_email'      => 'nullable|email|max:150',
            'contact_phone'      => 'nullable|string|max:30',
            'value'              => 'nullable|integer|min:0',
            'status'             => 'sometimes|in:new,contacted,qualified,proposal,negotiation,closed_won,closed_lost',
            'priority'           => 'sometimes|in:high,medium,low',
            'last_contact_date'  => 'nullable|date',
            'next_followup_date' => 'nullable|date',
            'notes'              => 'nullable|string|max:5000',
            'user_id'            => 'sometimes|exists:users,id',
        ];
        if (!$lead) {
            foreach (['title','company_id','contact_name'] as $f) $rules[$f] = str_replace('sometimes|','',$rules[$f]);
            if (!$request->has('user_id')) $request->merge(['user_id' => auth('api')->id()]);
        }
        return $request->validate($rules);
    }
}
