<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Notification;

class NotificationBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;
    public $userId;
    public $action; // 'created', 'updated', 'deleted', 'marked_read'

    /**
     * Create a new event instance.
     */
    public function __construct(Notification $notification, int $userId, string $action = 'created')
    {
        $this->notification = $notification;
        $this->userId = $userId;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Temporarily use public channel for testing
        return [
            new Channel('public-notifications-' . $this->userId)
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'notification.' . $this->action;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id' => $this->notification->id,
                'user_id' => $this->notification->user_id,
                'title' => $this->notification->title,
                'message' => $this->notification->message,
                'type' => $this->notification->type,
                'data' => $this->notification->data,
                'is_read' => $this->notification->is_read,
                'action_required' => $this->notification->action_required,
                'request_id' => $this->notification->request_id,
                'created_at' => $this->notification->created_at,
                'updated_at' => $this->notification->updated_at,
            ],
            'action' => $this->action,
            'unread_count' => $this->getUnreadCount()
        ];
    }

    /**
     * Get the unread count for the user
     */
    private function getUnreadCount(): int
    {
        return Notification::where('user_id', $this->userId)
            ->where('is_read', false)
            ->count();
    }
}
