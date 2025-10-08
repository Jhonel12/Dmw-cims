<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('customer_feedback', function (Blueprint $table) {
            $table->enum('client_channel', ['walk-in', 'online'])->nullable()->after('client_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('customer_feedback', function (Blueprint $table) {
            $table->dropColumn('client_channel');
        });
    }
};
