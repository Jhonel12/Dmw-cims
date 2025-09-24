<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('damage_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('reported_by_user_id');
            $table->timestamp('damage_date');
            $table->enum('damage_type', [
                'physical_damage',
                'water_damage', 
                'expired',
                'broken_during_handling',
                'defective_upon_arrival',
                'storage_damage',
                'transportation_damage',
                'other'
            ]);
            $table->integer('damaged_quantity')->default(1); // ✅ added column
            $table->text('description');
            $table->enum('severity', ['minor', 'major', 'total_loss']);
            $table->decimal('estimated_repair_cost', 10, 2)->nullable();
            $table->enum('status', ['reported', 'under_repair', 'repaired', 'disposed'])->default('reported');
            $table->timestamp('repaired_date')->nullable();
            $table->unsignedBigInteger('repaired_by_user_id')->nullable();
            $table->decimal('actual_repair_cost', 10, 2)->nullable();
            $table->text('repair_notes')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
            $table->foreign('reported_by_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('repaired_by_user_id')->references('id')->on('users')->onDelete('set null');

            // Indexes for better performance
            $table->index('item_id');
            $table->index('reported_by_user_id');
            $table->index('status');
            $table->index('damage_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('damage_items');
    }
};
