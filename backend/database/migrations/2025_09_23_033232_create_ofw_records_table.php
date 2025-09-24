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
        Schema::create('ofw_records', function (Blueprint $table) {
            $table->id();
            $table->string('nameOfWorker'); // worker full name
            $table->enum('sex', ['Male', 'Female']); // gender
            $table->string('position'); // position / profession
            $table->string('countryDestination'); // country of destination
            $table->text('address'); // full address
            $table->string('employer'); // employer name
            $table->string('oecNumber')->unique(); // OEC / e-receipt number (merged field)
            $table->date('departureDate'); // departure date
            $table->timestamps(); // created_at, updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ofw_records');
    }
};
