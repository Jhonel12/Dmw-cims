<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OFW extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ofw_records';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nameOfWorker',
        'sex',
        'position',
        'countryDestination',
        'address',
        'employer',
        'oecNumber',
        'departureDate',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'departureDate' => 'date',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'deleted_at',
    ];

    /**
     * Scope to filter by sex
     */
    public function scopeBySex($query, $sex)
    {
        return $query->where('sex', $sex);
    }

    /**
     * Scope to filter by country destination
     */
    public function scopeByCountry($query, $country)
    {
        return $query->where('countryDestination', $country);
    }

    /**
     * Scope to filter by position
     */
    public function scopeByPosition($query, $position)
    {
        return $query->where('position', $position);
    }

    /**
     * Scope to search by multiple fields
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('nameOfWorker', 'like', "%{$search}%")
              ->orWhere('position', 'like', "%{$search}%")
              ->orWhere('countryDestination', 'like', "%{$search}%")
              ->orWhere('employer', 'like', "%{$search}%")
              ->orWhere('oecNumber', 'like', "%{$search}%");
        });
    }

    /**
     * Scope to filter by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('departureDate', [$startDate, $endDate]);
    }

    /**
     * Get the worker's full name
     */
    public function getFullNameAttribute()
    {
        return $this->nameOfWorker;
    }

    /**
     * Get formatted departure date
     */
    public function getFormattedDepartureDateAttribute()
    {
        return $this->departureDate ? $this->departureDate->format('M d, Y') : null;
    }
}
