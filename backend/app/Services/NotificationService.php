<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Events\NotificationBroadcast;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public function createNotification(array $data): Notification
    {
        $notification = Notification::create($data);
        
        // Broadcast the notification
        try {
            $broadcastResult = broadcast(new NotificationBroadcast($notification, $notification->user_id, 'created'));
            
            if ($broadcastResult) {
                \Log::info('✅ NOTIFICATION SERVICE BROADCAST SUCCESS', [
                    'notification_id' => $notification->id,
                    'user_id' => $notification->user_id,
                    'type' => $notification->type,
                    'broadcast_channel' => 'user.' . $notification->user_id,
                    'event_type' => 'notification.created'
                ]);
            } else {
                \Log::warning('⚠️ NOTIFICATION SERVICE BROADCAST FAILED', [
                    'notification_id' => $notification->id,
                    'user_id' => $notification->user_id,
                    'broadcast_result' => $broadcastResult
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('❌ NOTIFICATION SERVICE BROADCAST ERROR', [
                'notification_id' => $notification->id,
                'user_id' => $notification->user_id,
                'error' => $e->getMessage()
            ]);
        }
        
        return $notification;
    }

    /**
     * Create notification for request creation
     * 3-tier workflow: focal_person → division_chief → admin
     */
    public function notifyRequestCreated($request, User $requester): Notification
    {
        try {
            $notifications = [];
            
            // Get requester's division
            $requesterDivisionId = $requester->division_id;
            
            // Step 1: Notify the requester (confirmation)
            $notifications[] = $this->createNotification([
                'user_id' => $requester->id,
                'title' => 'Request Submitted',
                'message' => sprintf(
                    'Your supply request #%d has been submitted successfully',
                    $request->id
                ),
                'type' => 'request_created',
                'request_id' => $request->id,
                'is_read' => false,
                'priority' => 'low',
                'action_required' => false,
                'sender_name' => 'System',
                'sender_email' => 'system@company.com',
                'data' => [
                    'request_id' => $request->id,
                    'requester_name' => $requester->name,
                    'requester_division' => $requester->division_name,
                    'is_urgent' => $request->is_urgent,
                    'created_at' => $request->created_at ?? now()->toDateTimeString(),
                ]
            ]);

            // Step 2: Notify Division Chief (if requester is focal_person)
            if ($requester->user_role === 'focal_person' && $requesterDivisionId) {
                $divisionChief = User::where('user_role', 'division_chief')
                    ->where('division_id', $requesterDivisionId)
                    ->first();
                
                if ($divisionChief) {
                    $notifications[] = $this->createNotification([
                        'user_id' => $divisionChief->id,
                        'title' => 'New Request for Review',
                        'message' => sprintf(
                            'New supply request #%d from %s (%s) needs your review',
                            $request->id,
                            $requester->name,
                            $requester->division_name ?? 'Unknown Division'
                        ),
                        'type' => 'request_created',
                        'request_id' => $request->id,
                        'is_read' => false,
                        'priority' => $request->is_urgent ? 'urgent' : 'medium',
                        'action_required' => true,
                        'sender_name' => $requester->name,
                        'sender_email' => $requester->email,
                        'data' => [
                            'request_id' => $request->id,
                            'requester_name' => $requester->name,
                            'requester_division' => $requester->division_name,
                            'is_urgent' => $request->is_urgent,
                            'created_at' => $request->created_at ?? now()->toDateTimeString(),
                        ]
                    ]);
                }
            }

            // Step 3: Notify Admin (if requester is division_chief or if urgent)
            if ($requester->user_role === 'division_chief' || $request->is_urgent) {
                $admins = User::where('user_role', 'admin')->get();
                
                foreach ($admins as $admin) {
                    $title = $request->is_urgent ? 'Urgent Request Alert' : 'New Request for Review';
                    $message = $request->is_urgent 
                        ? sprintf('URGENT: Request #%d from %s requires immediate attention', $request->id, $requester->name)
                        : sprintf('New supply request #%d from %s (%s) needs admin review', $request->id, $requester->name, $requester->division_name ?? 'Unknown Division');
                    
                    $notifications[] = $this->createNotification([
                        'user_id' => $admin->id,
                        'title' => $title,
                        'message' => $message,
                        'type' => $request->is_urgent ? 'urgent_request' : 'request_created',
                        'request_id' => $request->id,
                        'is_read' => false,
                        'priority' => $request->is_urgent ? 'urgent' : 'medium',
                        'action_required' => true,
                        'sender_name' => $requester->name,
                        'sender_email' => $requester->email,
                        'data' => [
                            'request_id' => $request->id,
                            'requester_name' => $requester->name,
                            'requester_division' => $requester->division_name,
                            'is_urgent' => $request->is_urgent,
                            'created_at' => $request->created_at ?? now()->toDateTimeString(),
                        ]
                    ]);
                }
            }

            // Return the first notification created
            return $notifications[0] ?? $this->createFallbackNotification($request, $requester);
        
        } catch (\Exception $e) {
            \Log::error('Error creating request creation notifications: ' . $e->getMessage());
            return $this->createFallbackNotification($request, $requester, $e->getMessage());
        }
    }

    /**
     * Create fallback notification when main notification creation fails
     */
    private function createFallbackNotification($request, User $requester, string $error = null): Notification
    {
        return $this->createNotification([
            'user_id' => $requester->id,
            'title' => 'Request Created',
            'message' => sprintf(
                'Your supply request #%d has been created successfully',
                $request->id
            ),
            'type' => 'request_created',
            'request_id' => $request->id,
            'is_read' => false,
            'priority' => $request->is_urgent ? 'urgent' : 'medium',
            'action_required' => false,
            'sender_name' => 'System',
            'sender_email' => 'system@company.com',
            'data' => [
                'request_id' => $request->id,
                'requester_name' => $requester->name,
                'is_urgent' => $request->is_urgent,
                'created_at' => $request->created_at ?? now()->toDateTimeString(),
                'error' => $error ?? 'Notification creation had issues but request was created successfully'
            ]
        ]);
    }

    /**
     * Create notification for request approval
     * Handles 3-tier workflow: division_chief approval → admin notification
     */
    public function notifyRequestApproved($request, User $approver, string $approvalType = 'evaluator'): Notification
    {
        $notifications = [];
        
        // Get requester info
        $requester = User::find($request->user_id);
        
        // Step 1: Notify the requester
        $notifications[] = $this->createNotification([
            'user_id' => $request->user_id,
            'title' => 'Request Approved',
            'message' => sprintf(
                'Your supply request #%d has been approved by %s',
                $request->id,
                $approver->name
            ),
            'type' => 'request_approved',
            'request_id' => $request->id,
            'is_read' => false,
            'priority' => 'low',
            'action_required' => false,
            'sender_name' => $approver->name,
            'sender_email' => $approver->email,
            'data' => [
                'request_id' => $request->id,
                'approver_name' => $approver->name,
                'approval_type' => $approvalType,
                'approved_at' => now()->toDateTimeString(),
            ]
        ]);

        // Step 2: If division_chief approved, notify admins for final review
        if ($approvalType === 'evaluator' && $approver->user_role === 'division_chief') {
            $admins = User::where('user_role', 'admin')->get();
            
            foreach ($admins as $admin) {
                $notifications[] = $this->createNotification([
                    'user_id' => $admin->id,
                    'title' => 'Request Ready for Admin Review',
                    'message' => sprintf(
                        'Request #%d from %s (%s) has been approved by Division Chief and is ready for admin review',
                        $request->id,
                        $requester->name ?? 'Unknown',
                        $requester->division_name ?? 'Unknown Division'
                    ),
                    'type' => 'request_under_review',
                    'request_id' => $request->id,
                    'is_read' => false,
                    'priority' => $request->is_urgent ? 'urgent' : 'medium',
                    'action_required' => true,
                    'sender_name' => $approver->name,
                    'sender_email' => $approver->email,
                    'data' => [
                        'request_id' => $request->id,
                        'requester_name' => $requester->name ?? 'Unknown',
                        'requester_division' => $requester->division_name ?? 'Unknown Division',
                        'division_chief_name' => $approver->name,
                        'approved_at' => now()->toDateTimeString(),
                    ]
                ]);
            }
        }

        // Step 3: If admin approved, notify requester of final approval
        if ($approvalType === 'admin' && $approver->user_role === 'admin') {
            // Update the requester notification to reflect final approval
            $notifications[0]['title'] = 'Request Fully Approved';
            $notifications[0]['message'] = sprintf(
                'Your supply request #%d has been fully approved and is ready for processing',
                $request->id
            );
            $notifications[0]['priority'] = 'medium';
            $notifications[0]['data']['final_approval'] = true;
        }

        return $notifications[0];
    }

    /**
     * Create notification for request rejection
     * Handles 3-tier workflow: rejection at any level notifies requester
     */
    public function notifyRequestRejected($request, User $rejector, string $reason = null, string $rejectionType = 'evaluator'): Notification
    {
        // Get requester info
        $requester = User::find($request->user_id);
        
        // Determine rejection level and message
        $rejectionLevel = '';
        if ($rejector->user_role === 'division_chief') {
            $rejectionLevel = 'Division Chief';
        } elseif ($rejector->user_role === 'admin') {
            $rejectionLevel = 'Admin';
        }
        
        $title = $rejectionLevel ? "Request Rejected by {$rejectionLevel}" : 'Request Rejected';
        $message = sprintf(
            'Your supply request #%d has been rejected by %s%s',
            $request->id,
            $rejector->name,
            $reason ? ': ' . $reason : ''
        );

        return $this->createNotification([
            'user_id' => $request->user_id, // Notify the requester
            'title' => $title,
            'message' => $message,
            'type' => 'request_rejected',
            'request_id' => $request->id,
            'is_read' => false,
            'priority' => 'medium',
            'action_required' => false,
            'sender_name' => $rejector->name,
            'sender_email' => $rejector->email,
            'data' => [
                'request_id' => $request->id,
                'rejector_name' => $rejector->name,
                'rejector_role' => $rejector->user_role,
                'rejection_type' => $rejectionType,
                'rejection_reason' => $reason,
                'rejected_at' => now()->toDateTimeString(),
            ]
        ]);
    }

    /**
     * Create notification for request ready for pickup
     */
    public function notifyRequestReadyForPickup($request, User $notifier): Notification
    {
        return $this->createNotification([
            'user_id' => $request->user_id, // Notify the requester
            'title' => 'Request Ready for Pickup',
            'message' => sprintf(
                'Your supply request #%d is ready for pickup at the warehouse',
                $request->id
            ),
            'type' => 'request_ready_pickup',
            'request_id' => $request->id,
            'is_read' => false,
            'priority' => 'medium',
            'action_required' => true,
            'sender_name' => $notifier->name,
            'sender_email' => $notifier->email,
            'data' => [
                'request_id' => $request->id,
                'pickup_location' => 'Warehouse',
                'pickup_hours' => '9 AM - 5 PM',
                'ready_at' => now()->toDateTimeString(),
            ]
        ]);
    }

    /**
     * Create notification for request completion
     */
    public function notifyRequestCompleted($request, User $completer): Notification
    {
        return $this->createNotification([
            'user_id' => $request->user_id, // Notify the requester
            'title' => 'Request Completed',
            'message' => sprintf(
                'Your supply request #%d has been fully processed and completed',
                $request->id
            ),
            'type' => 'request_completed',
            'request_id' => $request->id,
            'is_read' => false,
            'priority' => 'low',
            'action_required' => false,
            'sender_name' => $completer->name,
            'sender_email' => $completer->email,
            'data' => [
                'request_id' => $request->id,
                'completed_by' => $completer->name,
                'completed_at' => now()->toDateTimeString(),
            ]
        ]);
    }

    /**
     * Create notification for request status change
     */
    public function notifyRequestStatusChange($request, User $changer, string $oldStatus, string $newStatus): Notification
    {
        $statusMessages = [
            'pending' => 'is pending review',
            'evaluator_approved' => 'has been approved by evaluator',
            'admin_approved' => 'has been approved by admin',
            'rejected' => 'has been rejected',
            'cancelled' => 'has been cancelled',
        ];

        $message = sprintf(
            'Request #%d %s',
            $request->id,
            $statusMessages[$newStatus] ?? 'status has changed'
        );

        return $this->createNotification([
            'user_id' => $request->user_id,
            'title' => 'Request Status Updated',
            'message' => $message,
            'type' => 'general',
            'request_id' => $request->id,
            'is_read' => false,
            'priority' => 'low',
            'action_required' => false,
            'sender_name' => $changer->name,
            'sender_email' => $changer->email,
            'data' => [
                'request_id' => $request->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $changer->name,
                'changed_at' => now()->toDateTimeString(),
            ]
        ]);
    }

    /**
     * Bulk create notifications for multiple users
     */
    public function bulkCreateNotifications(array $notifications): array
    {
        $created = [];
        foreach ($notifications as $notificationData) {
            $created[] = $this->createNotification($notificationData);
        }
        return $created;
    }

    /**
     * Get notification count for user
     */
    public function getNotificationCount(int $userId, bool $unreadOnly = false): int
    {
        $query = Notification::where('user_id', $userId);
        
        if ($unreadOnly) {
            $query->unread();
        }
        
        return $query->count();
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }
}
