<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'division_id',
        'action',
        'entity_type',
        'entity_id',
        'details',
        'timestamp',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'timestamp' => 'datetime',
    ];

    /**
     * Get the user that performed the activity.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the division related to the activity.
     */
    public function division()
    {
        return $this->belongsTo(Division::class);
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
     * Scope a query to filter by division.
     */
    public function scopeByDivision($query, $divisionId)
    {
        return $query->where('division_id', $divisionId);
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
}
