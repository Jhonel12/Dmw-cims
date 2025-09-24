<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DivisionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $divisions = [
            [
                'name' => 'Finance Division',
                'description' => 'Handles financial management, budgeting, accounting, and fiscal oversight for migrant worker programs and services.',
                'head_of_division' => 'Maria Santos',
                'location' => 'Building A, Floor 2',
                'established_date' => '2020-01-15',
                'notes' => 'Primary division for financial operations and budget management',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Welfare Division',
                'description' => 'Provides social services, counseling, and support programs for migrant workers and their families.',
                'head_of_division' => 'Juan Dela Cruz',
                'location' => 'Building B, Floor 1',
                'established_date' => '2020-02-20',
                'notes' => 'Focuses on migrant worker welfare and social support services',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Processing Division',
                'description' => 'Manages document processing, applications, permits, and administrative procedures for migrant workers.',
                'head_of_division' => 'Ana Rodriguez',
                'location' => 'Building A, Floor 3',
                'established_date' => '2020-03-10',
                'notes' => 'Handles all processing and administrative procedures',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Admin Division',
                'description' => 'Provides administrative support, human resources, and general office management for the department.',
                'head_of_division' => 'Pedro Martinez',
                'location' => 'Building C, Floor 1',
                'established_date' => '2020-01-01',
                'notes' => 'Central administrative division for department operations',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Protection Division',
                'description' => 'Ensures migrant worker rights protection, legal assistance, and compliance with labor laws and regulations.',
                'head_of_division' => 'Carmen Reyes',
                'location' => 'Building B, Floor 2',
                'established_date' => '2020-04-05',
                'notes' => 'Dedicated to protecting migrant worker rights and legal compliance',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('divisions')->insert($divisions);
    }
} 