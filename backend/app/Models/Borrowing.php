<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Borrowing extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'borrower_name',
        'contact_details',
        'borrowed_qty',
        'borrow_date',
        'expected_return_date',
        'returned_date',
        'status',
        'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'item_id' => 'integer',
            'borrowed_qty' => 'integer',
            'borrow_date' => 'date',
            'expected_return_date' => 'date',
            'returned_date' => 'date',
            'processed_by' => 'integer',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
