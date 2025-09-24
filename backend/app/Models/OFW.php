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
     * Get the user that owns the OFW record.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
