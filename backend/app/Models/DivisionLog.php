<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DivisionLog extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'division_logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'division_id',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'details',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'timestamp',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'timestamp' => 'datetime',
    ];

    /**
     * Get the division that owns the log.
     */
    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the user that performed the action.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to filter by division.
     */
    public function scopeByDivision($query, $divisionId)
    {
        return $query->where('division_id', $divisionId);
    }

    /**
     * Scope a query to filter by entity type.
     */
    public function scopeOfEntityType($query, $type)
    {
        return $query->where('entity_type', $type);
    }

    /**
     * Scope a query to filter by action.
     */
    public function scopeOfAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope a query to filter by user.
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeInDateRange($query, $from, $to)
    {
        if ($from) {
            $query->whereDate('timestamp', '>=', $from);
        }

        if ($to) {
            $query->whereDate('timestamp', '<=', $to);
        }

        return $query;
    }

    /**
     * Create a log entry for division activities.
     */
    public static function logDivisionActivity(
        $divisionId,
        $userId,
        $action,
        $entityType,
        $entityId = null,
        $details = '',
        $oldValues = null,
        $newValues = null,
        $ipAddress = null,
        $userAgent = null
    ) {
        return self::create([
            'division_id' => $divisionId,
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'timestamp' => now(),
        ]);
    }
}
