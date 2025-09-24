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
        Schema::create('supplies', function (Blueprint $table) {
            $table->id();
            $table->string('property_no')->unique();
            $table->unsignedBigInteger('division_id');
            $table->string('item_name');
            $table->integer('quantity');
            $table->string('unit');
            $table->date('date_received');
            $table->text('notes')->nullable();
            $table->text('remarks')->nullable();
            $table->string('category');
            $table->enum('status', ['in-stock', 'low-stock', 'out-of-stock'])->default('in-stock');
            $table->string('supplier')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->timestamps();
            
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplies');
    }
}; 