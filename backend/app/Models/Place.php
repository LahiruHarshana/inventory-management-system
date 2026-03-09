<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Place extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'cupboard_id',
        'name',
    ];

    protected function casts(): array
    {
        return [
            'cupboard_id' => 'integer',
        ];
    }

    public function cupboard(): BelongsTo
    {
        return $this->belongsTo(Cupboard::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
