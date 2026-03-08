<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('place_id')
                ->constrained('places')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('total_quantity')->default(0);
            $table->unsignedInteger('available_quantity')->default(0);
            $table->enum('status', ['In-Store', 'Borrowed', 'Damaged', 'Missing'])->default('In-Store')->index();
            $table->string('serial_number')->nullable();
            $table->timestamps();

            $table->index('name');
            $table->index('serial_number');
        });

        DB::statement(
            'ALTER TABLE items ADD CONSTRAINT items_available_lte_total CHECK (available_quantity <= total_quantity)'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
