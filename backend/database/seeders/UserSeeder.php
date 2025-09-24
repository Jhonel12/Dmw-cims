<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get division IDs
        $financeDivision = DB::table('divisions')->where('name', 'Finance Division')->first();
        $welfareDivision = DB::table('divisions')->where('name', 'Welfare Division')->first();
        $processingDivision = DB::table('divisions')->where('name', 'Processing Division')->first();
        $adminDivision = DB::table('divisions')->where('name', 'Admin Division')->first();
        $protectionDivision = DB::table('divisions')->where('name', 'Protection Division')->first();

        $users = [
            // Admin Users (can access all divisions)
            [
                'name' => 'System Administrator',
                'email' => 'admin@dmw.gov.ph',
                'password' => Hash::make('admin123'),
                'user_role' => 'admin',
                'division_id' => null, // Admin can access all divisions
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Department Director',
                'email' => 'director@dmw.gov.ph',
                'password' => Hash::make('director123'),
                'user_role' => 'admin',
                'division_id' => null, // Director can access all divisions
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Finance Division Users
            [
                'name' => 'Maria Santos',
                'email' => 'maria.santos@dmw.gov.ph',
                'password' => Hash::make('finance123'),
                'user_role' => 'division_chief',
                'division_id' => $financeDivision ? $financeDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Carlos Mendoza',
                'email' => 'carlos.mendoza@dmw.gov.ph',
                'password' => Hash::make('finance456'),
                'user_role' => 'focal_person',
                'division_id' => $financeDivision ? $financeDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Welfare Division Users
            [
                'name' => 'Juan Dela Cruz',
                'email' => 'juan.delacruz@dmw.gov.ph',
                'password' => Hash::make('welfare123'),
                'user_role' => 'division_chief',
                'division_id' => $welfareDivision ? $welfareDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sofia Garcia',
                'email' => 'sofia.garcia@dmw.gov.ph',
                'password' => Hash::make('welfare456'),
                'user_role' => 'focal_person',
                'division_id' => $welfareDivision ? $welfareDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Processing Division Users
            [
                'name' => 'Ana Rodriguez',
                'email' => 'ana.rodriguez@dmw.gov.ph',
                'password' => Hash::make('processing123'),
                'user_role' => 'division_chief',
                'division_id' => $processingDivision ? $processingDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Miguel Lopez',
                'email' => 'miguel.lopez@dmw.gov.ph',
                'password' => Hash::make('processing456'),
                'user_role' => 'focal_person',
                'division_id' => $processingDivision ? $processingDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Admin Division Users
            [
                'name' => 'Pedro Martinez',
                'email' => 'pedro.martinez@dmw.gov.ph',
                'password' => Hash::make('admin456'),
                'user_role' => 'division_chief',
                'division_id' => $adminDivision ? $adminDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Isabella Torres',
                'email' => 'isabella.torres@dmw.gov.ph',
                'password' => Hash::make('admin789'),
                'user_role' => 'focal_person',
                'division_id' => $adminDivision ? $adminDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Protection Division Users
            [
                'name' => 'Carmen Reyes',
                'email' => 'carmen.reyes@dmw.gov.ph',
                'password' => Hash::make('protection123'),
                'user_role' => 'division_chief',
                'division_id' => $protectionDivision ? $protectionDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Roberto Silva',
                'email' => 'roberto.silva@dmw.gov.ph',
                'password' => Hash::make('protection456'),
                'user_role' => 'focal_person',
                'division_id' => $protectionDivision ? $protectionDivision->id : null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('users')->insert($users);
    }
}