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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('suffix')->nullable();
            $table->date('date_of_birth');
            $table->integer('age')->nullable(); // Auto-calculated but store for convenience
            $table->enum('civil_status', ['Single', 'Married', 'Widowed', 'Divorced', 'Separated']);
            $table->enum('sex', ['Male', 'Female']);
            $table->json('social_classification'); // Store multiple selections as JSON
            $table->string('social_classification_other')->nullable();

            // Address Information
            $table->string('house_number');
            $table->string('street');
            $table->string('barangay');
            $table->string('city'); // Changed from city_municipality to match form
            $table->string('province');
            $table->string('region');
            $table->string('zip_code');

            // Contact Information
            $table->string('telephone');
            $table->string('email')->unique();

            // Emergency Contact
            $table->string('emergency_name');
            $table->string('emergency_telephone');
            $table->string('emergency_relationship');

            // National ID
            $table->boolean('has_national_id')->default(false);
            $table->string('national_id_number')->nullable()->unique();

            // Soft deletes
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
