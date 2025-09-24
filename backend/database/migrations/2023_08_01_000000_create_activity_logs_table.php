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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('division_id')->nullable()->constrained()->nullOnDelete(); // Division tracking
            $table->string('action', 50); // create, update, delete, import, export, etc.
            $table->string('entity_type', 50); // Item, Category, Division, User, etc.
            $table->unsignedBigInteger('entity_id')->nullable(); // ID of the entity, nullable for bulk actions
            $table->text('details')->nullable(); // Description of what happened
            $table->timestamp('timestamp'); // When the action occurred
            $table->timestamps(); // created_at and updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
