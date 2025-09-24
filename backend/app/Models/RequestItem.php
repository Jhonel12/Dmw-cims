<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestItem extends Model
{
    use HasFactory;

    protected $table = 'item_request';

    protected $fillable = [
        'request_id',
        'item_id',
        'quantity',
        'remarks',
        'needed_date',
    ];

    protected $casts = [
        'needed_date' => 'date',
    ];

    /**
     * Get the request that owns this item.
     */
    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }

    /**
     * Get the item associated with this request.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
} 