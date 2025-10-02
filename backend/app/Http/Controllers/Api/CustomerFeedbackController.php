<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class CustomerFeedbackController extends Controller
{
    /**
     * Store a new customer feedback submission
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'control_no' => 'required|string',
            'client_type' => 'nullable|string',
            'client_channel' => 'nullable|string|in:walk-in,online',
            'date' => 'required|date',
            'sex' => 'nullable|string|in:Male,Female',
            'age' => 'nullable|integer|min:1|max:120',
            'region' => 'nullable|string|max:255',
            'service_availed' => 'nullable|string|max:255',
            'cc1' => 'nullable|string',
            'cc2' => 'nullable|string',
            'cc3' => 'nullable|string',
            'sqd0' => 'nullable|string',
            'sqd1' => 'nullable|string',
            'sqd2' => 'nullable|string',
            'sqd3' => 'nullable|string',
            'sqd4' => 'nullable|string',
            'sqd5' => 'nullable|string',
            'sqd6' => 'nullable|string',
            'sqd7' => 'nullable|string',
            'sqd8' => 'nullable|string',
            'suggestions' => 'nullable|string',
            'email' => 'nullable|email|max:255',
        ]);

        try {
            // Add timestamps
            $validated['created_at'] = now();
            $validated['updated_at'] = now();

            $id = DB::table('customer_feedback')->insertGetId($validated);
            
            // Generate complete control number: MMDDYY + ID
            $completeControlNo = $validated['control_no'] . $id;
            
            // Update the record with the complete control number
            DB::table('customer_feedback')
                ->where('id', $id)
                ->update(['control_no' => $completeControlNo]);

            return response()->json([
                'success' => true,
                'message' => 'Thank you for your feedback!',
                'data' => [
                    'id' => $id,
                    'control_no' => $completeControlNo
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit feedback. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all customer feedback (for admin purposes)
     */
    public function index(): JsonResponse
    {
        try {
            $feedback = DB::table('customer_feedback')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $feedback
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve feedback.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get survey list with filtering, pagination, and sorting (for admin dashboard)
     */
    public function getSurveyList(Request $request): JsonResponse
    {
        try {
            $query = DB::table('customer_feedback');

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('control_no', 'like', "%{$search}%")
                      ->orWhere('service_availed', 'like', "%{$search}%")
                      ->orWhere('region', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('client_channel') && $request->client_channel) {
                $query->where('client_channel', $request->client_channel);
            }

            if ($request->has('sex') && $request->sex) {
                $query->where('sex', $request->sex);
            }

            if ($request->has('region') && $request->region) {
                $query->where('region', $request->region);
            }

            if ($request->has('service_availed') && $request->service_availed) {
                $query->where('service_availed', 'like', "%{$request->service_availed}%");
            }

            if ($request->has('satisfaction_min') && $request->satisfaction_min) {
                $query->where('sqd0', '>=', $request->satisfaction_min);
            }

            if ($request->has('satisfaction_max') && $request->satisfaction_max) {
                $query->where('sqd0', '<=', $request->satisfaction_max);
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortDirection = $request->get('sort_direction', 'desc');
            
            $allowedSortFields = ['created_at', 'control_no', 'sqd0', 'client_channel', 'sex', 'region'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortDirection);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Get total count before pagination
            $total = $query->count();

            // Apply pagination
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            
            $feedback = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $feedback->items(),
                    'current_page' => $feedback->currentPage(),
                    'last_page' => $feedback->lastPage(),
                    'per_page' => $feedback->perPage(),
                    'total' => $feedback->total(),
                    'from' => $feedback->firstItem(),
                    'to' => $feedback->lastItem()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve survey list.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get feedback statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = DB::table('customer_feedback')
                ->selectRaw('
                    COUNT(*) as total_responses,
                    AVG(CASE WHEN sqd0 = "5" THEN 5 WHEN sqd0 = "4" THEN 4 WHEN sqd0 = "3" THEN 3 WHEN sqd0 = "2" THEN 2 WHEN sqd0 = "1" THEN 1 ELSE NULL END) as avg_satisfaction,
                    COUNT(CASE WHEN sex = "Male" THEN 1 END) as male_count,
                    COUNT(CASE WHEN sex = "Female" THEN 1 END) as female_count,
                    COUNT(CASE WHEN client_channel = "walk-in" THEN 1 END) as walk_in_count,
                    COUNT(CASE WHEN client_channel = "online" THEN 1 END) as online_count
                ')
                ->first();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}