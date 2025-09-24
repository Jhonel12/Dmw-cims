<?php 

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_request', function (Blueprint $table) {
            $table->id();

            $table->foreignId('request_id')->constrained('requests')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');

            $table->integer('quantity')->default(1);
            $table->text('remarks')->nullable();        // Optional: remarks per item
            $table->date('needed_date')->nullable();    // Optional: specific date per item

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_request');
    }
};
