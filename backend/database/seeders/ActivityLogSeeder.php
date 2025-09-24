<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActivityLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some users to assign logs to
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->info('No users found. Please run the UserSeeder first.');
            return;
        }

        // Sample actions
        $actions = ['create', 'update', 'delete', 'import', 'export', 'login', 'logout'];

        // Sample entity types
        $entityTypes = ['Item', 'Category', 'User', 'Division', 'Request', 'Stock', 'Report'];

        // Clear existing logs
        DB::table('activity_logs')->truncate();

        // Create 50 sample logs
        $logs = [];
        $now = now();
        $pastDate = now()->subDays(30);

        for ($i = 1; $i <= 50; $i++) {
            $user = $users->random();
            $action = $actions[array_rand($actions)];
            $entityType = $entityTypes[array_rand($entityTypes)];
            $entityId = $action === 'import' || $action === 'export' ? null : rand(1, 100);

            // Generate a realistic timestamp between 30 days ago and now
            $timestamp = fake()->dateTimeBetween($pastDate, $now)->format('Y-m-d H:i:s');

            // Generate details based on action and entity type
            $details = $this->generateLogDetails($action, $entityType, $entityId, $user->name);

            $logs[] = [
                'user_id' => $user->id,
                'division_id' => $user->division_id,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'details' => $details,
                'timestamp' => $timestamp,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        // Insert the logs in batch
        ActivityLog::insert($logs);

        $this->command->info('Sample activity logs seeded successfully.');
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

            default:
                return "Action performed on {$entityType} #{$entityId}";
        }
    }
}
