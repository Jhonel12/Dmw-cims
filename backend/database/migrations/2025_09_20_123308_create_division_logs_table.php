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
        Schema::create('division_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('division_id')->constrained('divisions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // create, update, delete, login, logout, etc.
            $table->string('entity_type'); // Item, Category, User, Request, etc.
            $table->unsignedBigInteger('entity_id')->nullable(); // ID of the affected entity
            $table->text('details'); // Detailed description of the action
            $table->json('old_values')->nullable(); // Store old values for updates
            $table->json('new_values')->nullable(); // Store new values for updates
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('timestamp');
            $table->timestamps();

            // Indexes for better performance
            $table->index(['division_id', 'timestamp']);
            $table->index(['user_id', 'timestamp']);
            $table->index(['entity_type', 'entity_id']);
            $table->index('action');
            $table->index('timestamp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('division_logs');
    }
};
