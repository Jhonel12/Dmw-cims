<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('item_no')->unique();
            $table->string('item_name')->nullable(false)->default('Unnamed Item');
            $table->unsignedBigInteger('category_id');
            $table->text('description')->nullable();
            $table->integer('quantity_on_hand')->default(0);
            $table->string('unit')->default('Piece');
            $table->integer('reorder_level')->nullable();
            $table->integer('reorder_quantity')->nullable();
            $table->string('supplier')->nullable();
            $table->date('last_ordered_date')->nullable();
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->foreign('category_id')->references('id')->on('categories');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
