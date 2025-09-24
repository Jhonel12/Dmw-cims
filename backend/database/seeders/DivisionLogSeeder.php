<?php

namespace Database\Seeders;

use App\Models\DivisionLog;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DivisionLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users with divisions
        $users = User::whereNotNull('division_id')->get();

        if ($users->isEmpty()) {
            $this->command->info('No users with divisions found. Please run the UserSeeder first.');
            return;
        }

        // Sample actions
        $actions = ['create', 'update', 'delete', 'import', 'export', 'login', 'logout', 'approve', 'reject'];

        // Sample entity types
        $entityTypes = ['Item', 'Category', 'User', 'Division', 'Request', 'Stock', 'Report'];

        // Clear existing division logs
        DivisionLog::truncate();

        // Create 100 sample division logs
        $logs = [];
        $now = now();
        $pastDate = now()->subDays(30);

        for ($i = 1; $i <= 100; $i++) {
            $user = $users->random();
            $action = $actions[array_rand($actions)];
            $entityType = $entityTypes[array_rand($entityTypes)];
            $entityId = $action === 'import' || $action === 'export' ? null : rand(1, 100);

            // Generate a realistic timestamp between 30 days ago and now
            $timestamp = fake()->dateTimeBetween($pastDate, $now);

            // Generate details based on action and entity type
            $details = $this->generateLogDetails($action, $entityType, $entityId, $user->name);

            $logs[] = [
                'division_id' => $user->division_id,
                'user_id' => $user->id,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'details' => $details,
                'old_values' => null,
                'new_values' => null,
                'ip_address' => fake()->ipv4(),
                'user_agent' => fake()->userAgent(),
                'timestamp' => $timestamp,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        // Insert the logs in batch
        DivisionLog::insert($logs);

        $this->command->info('Sample division logs seeded successfully.');
    }

    /**
     * Generate realistic log details based on action and entity
     */
    private function generateLogDetails(string $action, string $entityType, ?int $entityId, string $userName): string
    {
        switch ($action) {
            case 'create':
                $items = [
                    'Item' => ['Stapler', 'Printer Paper', 'Ballpen', 'Folder', 'Notebook', 'Marker', 'Whiteboard'],
                    'Category' => ['Office Supplies', 'IT Equipment', 'Furniture', 'Cleaning Supplies', 'Paper Products'],
                    'User' => ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Wilson'],
                    'Division' => ['IT Department', 'HR Department', 'Finance', 'Marketing', 'Operations'],
                    'Request' => ['Supply Request', 'Equipment Request', 'Resource Request', 'Material Request'],
                    'Stock' => ['Stapler Stock', 'Paper Stock', 'Pen Stock', 'Folder Stock', 'Notebook Stock'],
                    'Report' => ['Monthly Inventory', 'Quarterly Usage', 'Annual Audit', 'Stock Levels']
                ];

                $name = $items[$entityType][array_rand($items[$entityType])];
                return "Created new {$entityType}: {$name}";

            case 'update':
                $actions = [
                    'Item' => ['updated quantity', 'changed description', 'modified category', 'updated price'],
                    'Category' => ['renamed category', 'changed parent category', 'updated description'],
                    'User' => ['changed role', 'updated profile', 'changed password', 'modified division'],
                    'Division' => ['renamed division', 'updated manager', 'changed location'],
                    'Request' => ['approved request', 'denied request', 'modified items', 'changed status'],
                    'Stock' => ['adjusted quantity', 'added inventory', 'reduced stock', 'recorded loss'],
                    'Report' => ['updated parameters', 'regenerated report', 'changed criteria']
                ];

                $action = $actions[$entityType][array_rand($actions[$entityType])];
                return "Updated {$entityType} #{$entityId}: {$action}";

            case 'delete':
                return "Deleted {$entityType} #{$entityId}";

            case 'import':
                return "Imported {$entityType}s from CSV file";

            case 'export':
                return "Exported {$entityType}s to Excel format";

            case 'login':
                return "{$userName} logged in to the system";

            case 'logout':
                return "{$userName} logged out of the system";

            case 'approve':
                return "Approved {$entityType} #{$entityId}";

            case 'reject':
                return "Rejected {$entityType} #{$entityId}";

            default:
                return "Action performed on {$entityType} #{$entityId}";
        }
    }
}
