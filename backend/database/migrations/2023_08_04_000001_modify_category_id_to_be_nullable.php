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
        Schema::table('items', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['category_id']);

            // Change the column to be nullable
            $table->unsignedBigInteger('category_id')->nullable()->change();

            // Re-add the foreign key with onDelete('set null')
            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['category_id']);

            // Make the column non-nullable again
            $table->unsignedBigInteger('category_id')->nullable(false)->change();

            // Re-add the original foreign key
            $table->foreign('category_id')
                ->references('id')
                ->on('categories');
        });
    }
};
