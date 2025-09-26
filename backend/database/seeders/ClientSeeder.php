<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clients = [
            [
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'last_name' => 'Dela Cruz',
                'suffix' => null,
                'date_of_birth' => '1990-01-15',
                'age' => 34,
                'civil_status' => 'Single',
                'sex' => 'Male',
                'social_classification' => json_encode(['4Ps Beneficiary']),
                'social_classification_other' => null,
                'house_number' => '123',
                'street' => 'Rizal St.',
                'barangay' => 'Barangay 1',
                'city' => 'Cagayan de Oro',
                'province' => 'Misamis Oriental',
                'region' => 'Region X',
                'zip_code' => '9000',
                'telephone' => '088-1234567',
                'email' => 'juan.delacruz@example.com',
                'emergency_name' => 'Maria Dela Cruz',
                'emergency_telephone' => '09171234567',
                'emergency_relationship' => 'Mother',
                'has_national_id' => true,
                'national_id_number' => '123456789012',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'first_name' => 'Maria',
                'middle_name' => 'Reyes',
                'last_name' => 'Santos',
                'suffix' => null,
                'date_of_birth' => '1985-07-20',
                'age' => 39,
                'civil_status' => 'Married',
                'sex' => 'Female',
                'social_classification' => json_encode(['Senior Citizen']),
                'social_classification_other' => null,
                'house_number' => '45',
                'street' => 'Bonifacio Ave',
                'barangay' => 'Barangay 2',
                'city' => 'Cagayan de Oro',
                'province' => 'Misamis Oriental',
                'region' => 'Region X',
                'zip_code' => '9000',
                'telephone' => '088-2345678',
                'email' => 'maria.santos@example.com',
                'emergency_name' => 'Pedro Santos',
                'emergency_telephone' => '09181234567',
                'emergency_relationship' => 'Husband',
                'has_national_id' => false,
                'national_id_number' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'first_name' => 'Pedro',
                'middle_name' => 'Lopez',
                'last_name' => 'Garcia',
                'suffix' => 'Jr.',
                'date_of_birth' => '1995-03-12',
                'age' => 29,
                'civil_status' => 'Single',
                'sex' => 'Male',
                'social_classification' => json_encode(['PWD']),
                'social_classification_other' => null,
                'house_number' => '67',
                'street' => 'Del Pilar St.',
                'barangay' => 'Barangay 3',
                'city' => 'Cagayan de Oro',
                'province' => 'Misamis Oriental',
                'region' => 'Region X',
                'zip_code' => '9000',
                'telephone' => '088-3456789',
                'email' => 'pedro.garcia@example.com',
                'emergency_name' => 'Jose Garcia',
                'emergency_telephone' => '09191234567',
                'emergency_relationship' => 'Father',
                'has_national_id' => true,
                'national_id_number' => '987654321098',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'first_name' => 'Ana',
                'middle_name' => 'Torres',
                'last_name' => 'Cruz',
                'suffix' => null,
                'date_of_birth' => '2000-11-05',
                'age' => 23,
                'civil_status' => 'Single',
                'sex' => 'Female',
                'social_classification' => json_encode(['Youth']),
                'social_classification_other' => null,
                'house_number' => '89',
                'street' => 'Mabini St.',
                'barangay' => 'Barangay 4',
                'city' => 'Cagayan de Oro',
                'province' => 'Misamis Oriental',
                'region' => 'Region X',
                'zip_code' => '9000',
                'telephone' => '088-4567890',
                'email' => 'ana.cruz@example.com',
                'emergency_name' => 'Carmen Cruz',
                'emergency_telephone' => '09201234567',
                'emergency_relationship' => 'Sister',
                'has_national_id' => false,
                'national_id_number' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            // ✅ Add 6 more sample entries...
        ];

        // Add filler entries using loop
        for ($i = 5; $i <= 10; $i++) {
            $clients[] = [
                'first_name' => "Client{$i}",
                'middle_name' => null,
                'last_name' => "Lastname{$i}",
                'suffix' => null,
                'date_of_birth' => '1990-01-01',
                'age' => 34,
                'civil_status' => 'Single',
                'sex' => $i % 2 == 0 ? 'Male' : 'Female',
                'social_classification' => json_encode(['Indigent']),
                'social_classification_other' => null,
                'house_number' => "{$i}",
                'street' => "Sample Street {$i}",
                'barangay' => "Barangay {$i}",
                'city' => 'Cagayan de Oro',
                'province' => 'Misamis Oriental',
                'region' => 'Region X',
                'zip_code' => '9000',
                'telephone' => "088-10000{$i}",
                'email' => "client{$i}@example.com",
                'emergency_name' => "Emergency {$i}",
                'emergency_telephone' => "091700000{$i}",
                'emergency_relationship' => 'Relative',
                'has_national_id' => false,
                'national_id_number' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        DB::table('clients')->insert($clients);
    }
}
