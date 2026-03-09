<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Item extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'place_id',
        'name',
        'code',
        'description',
        'image_path',
        'total_quantity',
        'available_quantity',
        'status',
        'serial_number',
    ];

    protected function casts(): array
    {
        return [
            'place_id' => 'integer',
            'total_quantity' => 'integer',
            'available_quantity' => 'integer',
        ];
    }

    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class);
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class);
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
