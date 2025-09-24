<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'user_role',
        'division_id',
        'avatar',
        'cover_photo',
        'cover_photo_position',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];



    /**
     * Get the division that the user belongs to.
     */
    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin()
    {
        return $this->user_role === 'admin';
    }

    /**
     * Check if user is a manager
     */
    public function isManager()
    {
        return $this->user_role === 'manager';
    }

    /**
     * Check if user is staff
     */
    public function isStaff()
    {
        return $this->user_role === 'staff';
    }

    /**
     * Check if user is a viewer
     */
    public function isViewer()
    {
        return $this->user_role === 'viewer';
    }

    /**
     * Check if user is an evaluator
     */
    public function isEvaluator()
    {
        return $this->user_role === 'evaluator';
    }

    /**
     * Check if user is a division chief
     */
    public function isDivisionChief()
    {
        return $this->user_role === 'division_chief';
    }

    /**
     * Check if user has permission to access all divisions
     */
    public function canAccessAllDivisions()
    {
        return $this->isAdmin() || $this->isViewer();
    }

    /**
     * Get user's accessible divisions
     */
    public function getAccessibleDivisions()
    {
        if ($this->canAccessAllDivisions()) {
            return Division::where('is_active', true)->get();
        }

        return Division::where('id', $this->division_id)->where('is_active', true)->get();
    }

    /**
     * Check if user can access a specific division
     */
    public function canAccessDivision($divisionId)
    {
        if ($this->canAccessAllDivisions()) {
            return true;
        }

        return $this->division_id == $divisionId;
    }

    /**
     * Check if user is active
     */
    public function isActive()
    {
        return $this->is_active;
    }
    public function isFocalPerson(): bool
{
    return $this->role === 'focal_person';
    // OR use user_type if that's your column
    // return $this->user_type === 'focal_person';
}


}
