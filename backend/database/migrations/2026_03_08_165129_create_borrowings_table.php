<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')
                ->constrained('items')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('borrower_name');
            $table->text('contact_details');
            $table->unsignedInteger('borrowed_qty');
            $table->date('borrow_date');
            $table->date('expected_return_date');
            $table->date('returned_date')->nullable();
            $table->enum('status', ['Active', 'Returned'])->default('Active')->index();

            $table->foreignId('processed_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamps();

            $table->index(['item_id', 'status']);
            $table->index(['processed_by', 'status']);
            $table->index('borrow_date');
        });

        DB::statement(
            'ALTER TABLE borrowings ADD CONSTRAINT borrowings_borrowed_qty_positive CHECK (borrowed_qty > 0)'
        );

        DB::statement(
            'ALTER TABLE borrowings ADD CONSTRAINT borrowings_expected_return_after_borrow CHECK (expected_return_date >= borrow_date)'
        );

        DB::statement(
            "ALTER TABLE borrowings ADD CONSTRAINT borrowings_returned_date_logic CHECK (returned_date IS NULL OR returned_date >= borrow_date)"
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('borrowings');
    }
};
