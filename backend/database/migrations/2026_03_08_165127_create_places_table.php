<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cupboard_id')
                ->constrained('cupboards')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->index('name');
            $table->unique(['cupboard_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('places');
    }
};
