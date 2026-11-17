<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth('api')->user();
        return response()->json(['data' => $user->notifications()->latest()->paginate(20), 'unread_count' => $user->unreadNotifications()->count()]);
    }

    public function markRead(string $id): JsonResponse
    {
        auth('api')->user()->notifications()->findOrFail($id)->markAsRead();
        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(): JsonResponse
    {
        auth('api')->user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'All marked as read.']);
    }
}
