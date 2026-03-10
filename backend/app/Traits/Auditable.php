<?php

namespace App\Traits;

use App\Models\AuditLog;

trait Auditable
{
    protected static function booted(): void
    {
        static::created(function ($model): void {
            static::writeAuditLog($model, 'created');
        });

        static::updated(function ($model): void {
            static::writeAuditLog($model, 'updated');
        });

        static::deleted(function ($model): void {
            static::writeAuditLog($model, 'deleted');
        });
    }

    protected static function writeAuditLog(object $model, string $action): void
    {
        $original = method_exists($model, 'getOriginal') ? $model->getOriginal() : [];
        $changes = method_exists($model, 'getChanges') ? $model->getChanges() : [];
        $attributes = method_exists($model, 'getAttributes') ? $model->getAttributes() : [];

        $oldValues = match ($action) {
            'created' => null,
            'updated', 'deleted' => (array) $original,
            default => null,
        };

        $newValues = match ($action) {
            'created' => (array) $attributes,
            'updated' => (array) $changes,
            'deleted' => null,
            default => null,
        };

        AuditLog::query()->create([
            'user_id' => auth()->id(),
            'action' => $action,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
