<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password'), // hashed password
        ]);

        // Admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admins@example.com',
            'password' => Hash::make('admin123'), // hashed password
            'user_role' => 'admin',
        ]);

        $this->call(ClientSeeder::class);
        $this->call(OfwRecordSeeder::class);
    }
}
