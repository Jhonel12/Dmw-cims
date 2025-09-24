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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            
            // User who will receive the notification
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Notification content
            $table->string('title');
            $table->text('message');
            $table->enum('type', [
                'request_created',
                'request_approved', 
                'request_rejected',
                'request_under_review',
                'request_ready_pickup',
                'request_completed',
                'urgent_request',
                'general'
            ]);
            
            // Related request (optional)
            $table->foreignId('request_id')->nullable()->constrained('requests')->onDelete('cascade');
            
            // Notification status
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            
            // Priority and action requirements
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->boolean('action_required')->default(false);
            
            // Additional data (JSON for flexible data storage)
            $table->json('data')->nullable();
            
            // Sender information
            $table->string('sender_name');
            $table->string('sender_email')->nullable();
            
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['user_id', 'is_read']);
            $table->index(['type', 'created_at']);
            $table->index('request_id');
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
