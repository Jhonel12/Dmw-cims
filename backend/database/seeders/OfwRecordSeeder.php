<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OfwRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = [
            [
                'nameOfWorker' => 'Juan Dela Cruz',
                'sex' => 'Male',
                'position' => 'Engineer',
                'countryDestination' => 'Saudi Arabia',
                'address' => '123 Rizal St, Cagayan de Oro City',
                'employer' => 'Al Riyadh Construction',
                'oecNumber' => 'OEC1001',
                'departureDate' => '2025-01-15',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'nameOfWorker' => 'Maria Santos',
                'sex' => 'Female',
                'position' => 'Nurse',
                'countryDestination' => 'United Kingdom',
                'address' => '45 Bonifacio St, Manila',
                'employer' => 'NHS London',
                'oecNumber' => 'OEC1002',
                'departureDate' => '2025-02-01',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'nameOfWorker' => 'Pedro Garcia',
                'sex' => 'Male',
                'position' => 'Welder',
                'countryDestination' => 'Qatar',
                'address' => '67 Mabini St, Cebu City',
                'employer' => 'Qatar Steel Works',
                'oecNumber' => 'OEC1003',
                'departureDate' => '2025-02-10',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'nameOfWorker' => 'Ana Cruz',
                'sex' => 'Female',
                'position' => 'Domestic Helper',
                'countryDestination' => 'Hong Kong',
                'address' => '89 Magallanes St, Davao City',
                'employer' => 'Chan Family',
                'oecNumber' => 'OEC1004',
                'departureDate' => '2025-03-01',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'nameOfWorker' => 'Jose Ramirez',
                'sex' => 'Male',
                'position' => 'Driver',
                'countryDestination' => 'Dubai',
                'address' => '101 Colon St, Iloilo City',
                'employer' => 'Emirates Transport',
                'oecNumber' => 'OEC1005',
                'departureDate' => '2025-03-15',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // ✅ Generate 15 more sample entries
        for ($i = 6; $i <= 20; $i++) {
            $records[] = [
                'nameOfWorker' => "Worker {$i}",
                'sex' => $i % 2 === 0 ? 'Male' : 'Female',
                'position' => $i % 2 === 0 ? 'Technician' : 'Caregiver',
                'countryDestination' => $i % 3 === 0 ? 'Singapore' : ($i % 3 === 1 ? 'Japan' : 'Canada'),
                'address' => "Sample Address {$i}, Philippines",
                'employer' => "Employer {$i}",
                'oecNumber' => "OEC10{$i}",
                'departureDate' => Carbon::now()->addDays($i)->toDateString(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        DB::table('ofw_records')->insert($records);
    }
}
