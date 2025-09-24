<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Events\NotificationBroadcast;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $query = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        // Filter by read status
        if ($request->has('unread_only') && $request->boolean('unread_only')) {
            $query->unread();
        }

        // Filter by type
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->byPriority($request->priority);
        }

        // Filter by action required
        if ($request->has('action_required') && $request->boolean('action_required')) {
            $query->actionRequired();
        }

        $notifications = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'status' => 'success',
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
            'unread_count' => Notification::where('user_id', $user->id)->unread()->count(),
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        // Find the notification by ID
        $notification = Notification::find($id);

        // Check if notification exists
        if (!$notification) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found'
            ], 404);
        }

        // Ensure the notification belongs to the authenticated user
        if ($notification->user_id !== $user->id) {
            \Log::warning('Unauthorized notification access attempt', [
                'user_id' => $user ? $user->id : 'null',
                'notification_id' => $notification->id,
                'notification_user_id' => $notification->user_id
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access to notification'
            ], 403);
        }

        $notification->markAsRead();

        // Broadcast the notification update
        broadcast(new NotificationBroadcast($notification, $user->id, 'marked_read'));

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read',
            'data' => $notification->fresh()
        ]);
    }

    /**
     * Mark all notifications as read for the authenticated user
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $updated = Notification::where('user_id', $user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        // Note: Broadcasting is not needed for mark all as read since the UI updates immediately

        return response()->json([
            'status' => 'success',
            'message' => "Marked {$updated} notifications as read"
        ]);
    }

    /**
     * Get notification count for the authenticated user
     */
    public function count(Request $request): JsonResponse
    {
        $user = $request->user();

        $unreadCount = Notification::where('user_id', $user->id)->unread()->count();
        $totalCount = Notification::where('user_id', $user->id)->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'unread_count' => $unreadCount,
                'total_count' => $totalCount,
            ]
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        // Find the notification by ID
        $notification = Notification::find($id);

        // Check if notification exists
        if (!$notification) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found'
            ], 404);
        }

        // Ensure the notification belongs to the authenticated user
        if ($notification->user_id !== $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access to notification'
            ], 403);
        }

        // Store notification data before deletion for broadcasting
        $notificationData = $notification->toArray();
        $userId = $notification->user_id;
        
        $notification->delete();

        // Broadcast the notification deletion
        $dummyNotification = new Notification($notificationData);
        broadcast(new NotificationBroadcast($dummyNotification, $userId, 'deleted'));

        return response()->json([
            'status' => 'success',
            'message' => 'Notification deleted successfully'
        ]);
    }
}
