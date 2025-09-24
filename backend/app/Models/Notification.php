<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'request_id',
        'is_read',
        'read_at',
        'priority',
        'action_required',
        'data',
        'sender_name',
        'sender_email',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'action_required' => 'boolean',
        'read_at' => 'datetime',
        'data' => 'array',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Note: Request relationship removed since we're using query builder instead of Eloquent models

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeActionRequired($query)
    {
        return $query->where('action_required', true);
    }

    // Helper methods
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function markAsUnread()
    {
        $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    public function isUrgent(): bool
    {
        return $this->priority === 'urgent';
    }

    public function isHighPriority(): bool
    {
        return in_array($this->priority, ['urgent', 'high']);
    }
}
