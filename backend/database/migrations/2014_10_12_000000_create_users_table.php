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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('user_role', ['admin', 'focal_person', 'division_chief'])->default('focal_person');
            $table->unsignedBigInteger('division_id')->nullable();
            $table->string('avatar')->nullable(); // Profile avatar image path
            $table->string('cover_photo')->nullable(); // Cover photo image path
            $table->decimal('cover_photo_position', 5, 2)->default(50.00); // Cover photo vertical position (0-100%)
            $table->boolean('is_active')->default(true);
            $table->boolean('is_superadmin')->default(false);
            $table->boolean('is_delete')->default(false); // ✅ Soft delete flag
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};