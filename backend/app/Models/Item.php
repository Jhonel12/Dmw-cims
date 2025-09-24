<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'item_no',
        'item_name',
        'category_id',
        'description',
        'quantity_on_hand',
        'unit',
        'reorder_level',
        'reorder_quantity',
        'supplier',
        'last_ordered_date',
        'location',
        'notes'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity_on_hand' => 'integer',
        'reorder_level' => 'integer',
        'reorder_quantity' => 'integer',
        'last_ordered_date' => 'date',
    ];

    /**
     * Default attribute values
     *
     * @var array
     */
    protected $attributes = [
        'quantity_on_hand' => 0,
        'unit' => 'Piece',
    ];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($item) {
            // If item_no is empty or null, generate a new one
            if (empty($item->item_no) || is_null($item->item_no)) {
                $item->item_no = static::generateItemNo();
            }
        });
    }

    /**
     * Generate a unique item number
     * 
     * @return string
     */
    public static function generateItemNo()
    {
        // Get the last item to determine the next number
        $lastItem = static::orderBy('id', 'desc')->first();

        $nextId = $lastItem ? $lastItem->id + 1 : 1;
        $prefix = 'ITEM';
        $year = date('Y');

        // Format: ITEM-2025-00001 (ITEM-YEAR-ID with padding)
        return $prefix . '-' . $year . '-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Get the category that this item belongs to
     */
    public function category()
    {
        return $this->belongsTo(Category::class)->withDefault();
    }

    /**
     * Add an accessor to get the category name directly
     */
    public function getCategoryNameAttribute()
    {
        return $this->category && $this->category->exists ? $this->category->name : null;
    }
}
