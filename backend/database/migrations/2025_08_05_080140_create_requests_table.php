<?php 

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // requester
$table->enum('status', [
    'pending',
    'evaluator_approved',
    'admin_approved',
    'final_approved',
    'rejected',
    'cancelled'
])->default('pending');

            $table->boolean('is_urgent')->default(false);
            $table->text('remarks')->nullable();

            $table->date('needed_date')->nullable();     // when the items are needed
            $table->date('request_date')->nullable();    // optional, for tracking or backdating

            // Evaluator review
            $table->foreignId('evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('evaluator_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('evaluator_remarks')->nullable();
            $table->timestamp('evaluator_approved_at')->nullable(); // timestamp for evaluator approval

            // Admin approval
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('admin_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_remarks')->nullable();
            $table->timestamp('admin_approved_at')->nullable(); // timestamp for admin approval

            // New column: ready for pickup
            $table->boolean('ready_for_pickup')->default(false);

            // Pickup tracking
$table->string('received_by')->nullable(); // store name or ID as text
            $table->timestamp('is_done')->nullable(); // timestamp when the request was completed

            $table->timestamps(); // includes created_at and updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};