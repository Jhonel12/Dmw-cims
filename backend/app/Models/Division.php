<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'head_of_division',
        'location',
        'established_date',
        'notes',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'established_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Get the users that belong to this division.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the supplies that belong to this division.
     */
    public function supplies()
    {
        return $this->hasMany(Supply::class);
    }

    /**
     * Scope a query to only include active divisions.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include inactive divisions.
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * Get the head of division user.
     */
    public function headOfDivision()
    {
        return $this->belongsTo(User::class, 'head_of_division', 'name');
    }

    /**
     * Get the formatted established date.
     */
    public function getFormattedEstablishedDateAttribute()
    {
        return $this->established_date ? $this->established_date->format('F j, Y') : 'Not set';
    }

    /**
     * Get the short description.
     */
    public function getShortDescriptionAttribute()
    {
        return strlen($this->description) > 100 
            ? substr($this->description, 0, 100) . '...' 
            : $this->description;
    }

    /**
     * Check if division has users.
     */
    public function hasUsers()
    {
        return $this->users()->count() > 0;
    }

    /**
     * Check if division has supplies.
     */
    public function hasSupplies()
    {
        return $this->supplies()->count() > 0;
    }

    /**
     * Get user count for this division.
     */
    public function getUserCountAttribute()
    {
        return $this->users()->count();
    }

    /**
     * Get supply count for this division.
     */
    public function getSupplyCountAttribute()
    {
        return $this->supplies()->count();
    }
} 