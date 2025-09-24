<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Notification;
use App\Models\User;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some users to create notifications for
        $users = User::take(3)->get();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        // Get some request IDs from the database
        $requestIds = DB::table('requests')->pluck('id')->take(5)->toArray();

        $notifications = [
            [
                'user_id' => $users->first()->id,
                'title' => 'New Supply Request',
                'message' => 'New supply request submitted for office supplies',
                'type' => 'request_created',
                'request_id' => $requestIds[0] ?? null,
                'is_read' => false,
                'priority' => 'medium',
                'action_required' => true,
                'sender_name' => 'John Smith',
                'sender_email' => 'john.smith@company.com',
                'data' => [
                    'request_items' => ['Paper', 'Pens', 'Notebooks'],
                    'total_quantity' => 15
                ]
            ],
            [
                'user_id' => $users->first()->id,
                'title' => 'Urgent Request Alert',
                'message' => 'Urgent request for printer paper - needs immediate attention',
                'type' => 'urgent_request',
                'request_id' => $requestIds[1] ?? null,
                'is_read' => false,
                'priority' => 'urgent',
                'action_required' => true,
                'sender_name' => 'Sarah Johnson',
                'sender_email' => 'sarah.johnson@company.com',
                'data' => [
                    'urgency_reason' => 'Out of stock',
                    'needed_by' => '2024-01-15'
                ]
            ],
            [
                'user_id' => $users->first()->id,
                'title' => 'Request Approved',
                'message' => 'Supply request #998 has been approved by evaluator',
                'type' => 'request_approved',
                'request_id' => $requestIds[2] ?? null,
                'is_read' => true,
                'read_at' => now()->subHours(1),
                'priority' => 'low',
                'action_required' => false,
                'sender_name' => 'Mike Wilson',
                'sender_email' => 'mike.wilson@company.com',
                'data' => [
                    'approved_by' => 'Evaluator',
                    'approval_date' => now()->subHours(1)->toDateString()
                ]
            ],
            [
                'user_id' => $users->first()->id,
                'title' => 'Request Rejected',
                'message' => 'Request for stationery items rejected - insufficient budget',
                'type' => 'request_rejected',
                'request_id' => $requestIds[3] ?? null,
                'is_read' => true,
                'read_at' => now()->subHours(2),
                'priority' => 'medium',
                'action_required' => false,
                'sender_name' => 'Lisa Brown',
                'sender_email' => 'lisa.brown@company.com',
                'data' => [
                    'rejection_reason' => 'Insufficient budget',
                    'suggested_alternatives' => ['Basic stationery set']
                ]
            ],
            [
                'user_id' => $users->first()->id,
                'title' => 'Ready for Pickup',
                'message' => 'Supply request is ready for pickup at the warehouse',
                'type' => 'request_ready_pickup',
                'request_id' => $requestIds[4] ?? null,
                'is_read' => false,
                'priority' => 'medium',
                'action_required' => true,
                'sender_name' => 'David Lee',
                'sender_email' => 'david.lee@company.com',
                'data' => [
                    'pickup_location' => 'Warehouse A',
                    'pickup_hours' => '9 AM - 5 PM'
                ]
            ],
            [
                'user_id' => $users->skip(1)->first()?->id ?? $users->first()->id,
                'title' => 'Request Under Review',
                'message' => 'New request for cleaning supplies submitted',
                'type' => 'request_under_review',
                'request_id' => $requestIds[0] ?? null,
                'is_read' => true,
                'read_at' => now()->subHours(4),
                'priority' => 'low',
                'action_required' => false,
                'sender_name' => 'Emma Davis',
                'sender_email' => 'emma.davis@company.com',
                'data' => [
                    'reviewer' => 'Department Head',
                    'estimated_review_time' => '2-3 business days'
                ]
            ],
            [
                'user_id' => $users->first()->id,
                'title' => 'Emergency Request',
                'message' => 'Urgent: Request for emergency supplies needs admin approval',
                'type' => 'urgent_request',
                'request_id' => $requestIds[1] ?? null,
                'is_read' => false,
                'priority' => 'urgent',
                'action_required' => true,
                'sender_name' => 'Robert Garcia',
                'sender_email' => 'robert.garcia@company.com',
                'data' => [
                    'emergency_type' => 'Equipment failure',
                    'impact_level' => 'High'
                ]
            ],
            [
                'user_id' => $users->first()->id,
                'title' => 'Request Completed',
                'message' => 'Supply request #995 has been fully processed and completed',
                'type' => 'request_completed',
                'request_id' => $requestIds[0] ?? null,
                'is_read' => true,
                'read_at' => now()->subDay(),
                'priority' => 'low',
                'action_required' => false,
                'sender_name' => 'Jennifer White',
                'sender_email' => 'jennifer.white@company.com',
                'data' => [
                    'completion_date' => now()->subDay()->toDateString(),
                    'delivery_method' => 'Direct delivery'
                ]
            ]
        ];

        foreach ($notifications as $notificationData) {
            Notification::create($notificationData);
        }

        $this->command->info('Notifications seeded successfully!');
    }
}
