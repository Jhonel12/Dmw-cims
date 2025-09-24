<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\DivisionLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of activity logs.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Ensure the user is authenticated
        if (!auth()->check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 401);
        }

        $query = ActivityLog::with(['user:id,name,email,user_role,division_id', 'user.division:id,name'])
            ->select(
                'activity_logs.*',
                'users.name as user_name',
                'users.user_role',
                DB::raw('divisions.name as division_name')
            )
            ->join('users', 'activity_logs.user_id', '=', 'users.id')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id');        // Apply filters if provided
        if ($request->filled('entity_type')) {
            $query->ofEntityType($request->entity_type);
        }

        if ($request->filled('action')) {
            $query->ofAction($request->action);
        }

        if ($request->filled('user_name')) {
            $query->where('users.name', 'like', '%' . $request->user_name . '%');
        }

        if ($request->filled('date_from') || $request->filled('date_to')) {
            $query->inDateRange($request->date_from, $request->date_to);
        }

        // Set pagination
        $perPage = $request->per_page ?? 15;

        // Order by timestamp descending (most recent first)
        $logs = $query->orderBy('timestamp', 'desc')->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Display activity logs for a specific division.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function divisionLogs(Request $request)
    {
        // Ensure the user is authenticated
        if (!auth()->check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 401);
        }

        $user = auth()->user();
        $divisionId = $user->division_id;

        // If user doesn't have a division assigned, return empty results
        if (!$divisionId) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 15,
                'total' => 0,
                'from' => 0,
                'to' => 0
            ]);
        }

        // Use the new DivisionLog model with proper relationships
        $query = DivisionLog::with(['user:id,name,email,user_role', 'division:id,name'])
            ->select(
                'division_logs.*',
                'users.name as user_name',
                'users.user_role',
                'divisions.name as division_name'
            )
            ->join('users', 'division_logs.user_id', '=', 'users.id')
            ->leftJoin('divisions', 'division_logs.division_id', '=', 'divisions.id')
            ->where('division_logs.division_id', $divisionId);

        // Apply filters if provided
        if ($request->filled('entity_type')) {
            $query->ofEntityType($request->entity_type);
        }

        if ($request->filled('action')) {
            $query->ofAction($request->action);
        }

        if ($request->filled('user_name')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->user_name . '%');
            });
        }

        if ($request->filled('date_from') || $request->filled('date_to')) {
            $query->inDateRange($request->date_from, $request->date_to);
        }

        // Set pagination
        $perPage = $request->per_page ?? 15;

        // Order by timestamp descending (most recent first) and paginate
        $logs = $query->orderBy('timestamp', 'desc')->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Display the specified activity log.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        // Ensure the user is authenticated
        if (!auth()->check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 401);
        }

        $log = ActivityLog::with(['user:id,name,email,user_role,division_id', 'user.division:id,name'])->findOrFail($id);

        // Add division_name if available
        if ($log->user && $log->user->division) {
            $log->division_name = $log->user->division->name;
        }

        return response()->json($log);
    }

    /**
     * Export activity logs to CSV.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function export(Request $request)
    {
        // Ensure the user is authenticated
        if (!auth()->check()) {
            // For consistency with return type, create an empty streamed response with error message
            return new StreamedResponse(function () {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Unauthorized access'
                ]);
            }, 401, ['Content-Type' => 'application/json']);
        }

        // Get current user's division for filtering
        $user = auth()->user();
        $divisionId = $user->division_id;

        $query = DivisionLog::with(['user:id,name,email,user_role', 'division:id,name'])
            ->select(
                'division_logs.*',
                'users.name as user_name',
                'users.user_role',
                'divisions.name as division_name'
            )
            ->join('users', 'division_logs.user_id', '=', 'users.id')
            ->leftJoin('divisions', 'division_logs.division_id', '=', 'divisions.id')
            ->where('division_logs.division_id', $divisionId);

        // Apply filters if provided
        if ($request->filled('entity_type')) {
            $query->ofEntityType($request->entity_type);
        }

        if ($request->filled('action')) {
            $query->ofAction($request->action);
        }

        if ($request->filled('user_name')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->user_name . '%');
            });
        }

        if ($request->filled('date_from') || $request->filled('date_to')) {
            $query->inDateRange($request->date_from, $request->date_to);
        }

        // Order by timestamp descending (most recent first)
        $logs = $query->orderBy('timestamp', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="activity_logs_' . date('Y-m-d') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');

            // Add headers
            fputcsv($file, [
                'ID',
                'User',
                'Action',
                'Entity Type',
                'Entity ID',
                'Details',
                'Timestamp',
                'Division'
            ]);

            // Add data
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->user_name ?? 'Unknown',
                    $log->action,
                    $log->entity_type,
                    $log->entity_id,
                    $log->details,
                    $log->timestamp->format('Y-m-d H:i:s'),
                    $log->division_name ?? 'Unknown'
                ]);
            }

            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    /**
     * Create a helper method to log activity from anywhere in the application.
     * 
     * @param  int    $userId
     * @param  string $action
     * @param  string $entityType
     * @param  int    $entityId
     * @param  string $details
     * @return \App\Models\ActivityLog
     */
    public static function logActivity($userId, $action, $entityType, $entityId, $details)
    {
        return ActivityLog::create([
            'user_id' => $userId,
            'division_id' => optional(User::find($userId))->division_id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }
}
