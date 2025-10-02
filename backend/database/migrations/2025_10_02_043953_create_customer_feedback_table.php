<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('customer_feedback', function (Blueprint $table) {
            $table->id();
            
            // Control Number for tracking
            $table->string('control_no')->unique(); // Unique control number for each feedback
            
            // Client Information
            $table->string('client_type')->nullable();
            $table->enum('client_channel', ['walk-in', 'online'])->nullable(); // Track if client is walk-in or online
            $table->date('date');
            $table->string('sex')->nullable();
            $table->integer('age')->nullable();
            $table->string('region')->nullable();
            $table->string('service_availed')->nullable();
            
            // Citizens Charter responses
            $table->string('cc1')->nullable(); // Awareness of CC
            $table->string('cc2')->nullable(); // CC visibility
            $table->string('cc3')->nullable(); // CC helpfulness
            
            // Service Quality Dimensions (SQD 0-8)
            $table->string('sqd0')->nullable(); // Overall satisfaction
            $table->string('sqd1')->nullable(); // Time spent
            $table->string('sqd2')->nullable(); // Requirements followed
            $table->string('sqd3')->nullable(); // Steps easy/simple
            $table->string('sqd4')->nullable(); // Information found easily
            $table->string('sqd5')->nullable(); // Reasonable fees
            $table->string('sqd6')->nullable(); // Fair treatment
            $table->string('sqd7')->nullable(); // Courteous staff
            $table->string('sqd8')->nullable(); // Got what needed
            
            // Optional fields
            $table->text('suggestions')->nullable();
            $table->string('email')->nullable();
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('customer_feedback');
    }
};