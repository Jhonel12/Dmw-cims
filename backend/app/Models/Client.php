<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'date_of_birth',
        'age',
        'civil_status',
        'sex',
        'social_classification',
        'social_classification_other',
        'house_number',
        'street',
        'barangay',
        'city',
        'province',
        'region',
        'zip_code',
        'telephone',
        'email',
        'emergency_name',
        'emergency_telephone',
        'emergency_relationship',
        'has_national_id',
        'national_id_number'
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'age' => 'integer',
        'social_classification' => 'array',
        'has_national_id' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    // Accessor for full name
    public function getFullNameAttribute()
    {
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= ' ' . $this->middle_name;
        }
        $name .= ' ' . $this->last_name;
        if ($this->suffix) {
            $name .= ' ' . $this->suffix;
        }
        return $name;
    }

    // Accessor for initials
    public function getInitialsAttribute()
    {
        return strtoupper(substr($this->first_name, 0, 1) . substr($this->last_name, 0, 1));
    }

    // Scope for verified clients (has national ID)
    public function scopeVerified($query)
    {
        return $query->where('has_national_id', true);
    }

    // Scope for unverified clients (no national ID)
    public function scopeUnverified($query)
    {
        return $query->where('has_national_id', false);
    }

    // Scope for OFW clients
    public function scopeOfw($query)
    {
        return $query->whereJsonContains('social_classification', 'OFW');
    }
}
