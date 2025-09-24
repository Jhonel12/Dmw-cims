<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\LogsActivity;
use App\Models\DivisionLog;
use App\Services\NotificationService;
use App\Events\NotificationBroadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RequestController extends Controller
{
    use LogsActivity;

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Log division-specific activity
     */
    private function logDivisionActivity($action, $entityType, $entityId, $details, $oldValues = null, $newValues = null)
    {
        $user = Auth::user();
        if ($user && $user->division_id) {
            try {
                DivisionLog::logDivisionActivity(
                    $user->division_id,
                    $user->id,
                    $action,
                    $entityType,
                    $entityId,
                    $details,
                    $oldValues,
                    $newValues,
                    request()->ip(),
                    request()->userAgent()
                );
            } catch (\Exception $e) {
                Log::error('Failed to log division activity: ' . $e->getMessage());
            }
        }
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('users as evaluator', 'requests.evaluator_id', '=', 'evaluator.id')
            ->leftJoin('users as admin', 'requests.admin_id', '=', 'admin.id')
            ->select([
                'requests.*',
                'requester.name as requester_name',
                'requester.email as requester_email',
                'evaluator.name as evaluator_name',
                'admin.name as admin_name'
            ]);

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('requests.status', $request->status);
        }

        // Filter by urgency
        if ($request->has('is_urgent') && $request->is_urgent !== null) {
            $query->where('requests.is_urgent', $request->is_urgent);
        }

        // Filter by user role (admin can see all, division chiefs see their division, others see their own)
        $user = Auth::user();
        if (!$user->isAdmin()) {
            if ($user->isDivisionChief()) {
                // Division chiefs can see requests from their division
                $query->where('requester.division_id', $user->division_id);
            } else {
                // Regular users can only see their own requests
                $query->where('requests.user_id', $user->id);
            }
        }

        // Filter by evaluator (division chief)
        if ($request->has('evaluator_id') && $request->evaluator_id) {
            $query->where('requests.evaluator_id', $request->evaluator_id);
        }

        // Filter by division
        if ($request->has('division_id') && $request->division_id) {
            $query->where('requester.division_id', $request->division_id);
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                // Search in request ID
                $q->where('requests.id', 'LIKE', "%{$searchTerm}%")
                    // Search in requester name
                    ->orWhere('requester.name', 'LIKE', "%{$searchTerm}%")
                    // Search in requester email
                    ->orWhere('requester.email', 'LIKE', "%{$searchTerm}%")
                    // Search in remarks
                    ->orWhere('requests.remarks', 'LIKE', "%{$searchTerm}%")
                    // Search in evaluator name
                    ->orWhere('evaluator.name', 'LIKE', "%{$searchTerm}%")
                    // Search in admin name
                    ->orWhere('admin.name', 'LIKE', "%{$searchTerm}%")
                    // Search in items (using subquery)
                    ->orWhereExists(function ($subQuery) use ($searchTerm) {
                        $subQuery->select(DB::raw(1))
                            ->from('item_request')
                            ->join('items', 'item_request.item_id', '=', 'items.id')
                            ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
                            ->where('item_request.request_id', DB::raw('requests.id'))
                            ->where(function ($itemQuery) use ($searchTerm) {
                                $itemQuery->where('items.item_name', 'LIKE', "%{$searchTerm}%")
                                    ->orWhere('items.item_no', 'LIKE', "%{$searchTerm}%")
                                    ->orWhere('items.description', 'LIKE', "%{$searchTerm}%")
                                    ->orWhere('categories.name', 'LIKE', "%{$searchTerm}%");
                            });
                    });
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->where('requests.created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->where('requests.created_at', '<=', $request->date_to);
        }

        // Sort
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSortFields = ['created_at', 'status', 'is_urgent', 'needed_date'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy("requests.{$sortField}", $sortDirection);
        }

        // Pagination
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        // Get paginated results
        $requests = $query->paginate($perPage, ['*'], 'page', $page);
        
        // Debug: Log the total count
        \Log::info('Requests total count: ' . $requests->total());
        \Log::info('Requests last page: ' . $requests->lastPage());
    
                // Get request items for each request
    // Get request items for each request
foreach ($requests->items() as $request) {
    $requestItems = DB::table('item_request')
        ->join('items', 'item_request.item_id', '=', 'items.id')
        ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
        ->select([
            'item_request.*',
            'items.item_name',
            'items.item_no',
            'items.description',
            'items.quantity_on_hand',
            'categories.name as category_name'
        ])
        ->where('item_request.request_id', $request->id)
        ->get();

    $request->items = $requestItems;

    // ✅ Ensure admin_status is "cancelled" if overall status is cancelled
    if ($request->status === 'cancelled') {
        $request->admin_status = 'cancelled';
    }
}

        // Debug logs removed for production

        // Get request items for each request
        foreach ($requests->items() as $request) {
            $requestItems = DB::table('item_request')
                ->join('items', 'item_request.item_id', '=', 'items.id')
                ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
                ->select([
                    'item_request.*',
                    'items.item_name',
                    'items.item_no',
                    'items.description',
                    'items.quantity_on_hand',
                    'categories.name as category_name'
                ])
                ->where('item_request.request_id', $request->id)
                ->get();

            $request->items = $requestItems;
        }

        return response()->json([
            'status' => 'success',
            'data' => $requests->items(),
            'current_page' => $requests->currentPage(),
            'last_page' => $requests->lastPage(),
            'per_page' => $requests->perPage(),
            'total' => $requests->total(),
            'from' => $requests->firstItem(),
            'to' => $requests->lastItem()
        ]);
    }

    /**
     * Aggregated per-division stats for dashboard
     * - active_total: pending + evaluator_approved + admin_approved
     * - active_urgent: same as active_total but is_urgent = 1
     * - month_total: requests created between date_from/date_to
     * Applies role-based scoping: admins see all divisions; others see only their division.
     */
    public function getDivisionStats(Request $request)
    {
        $user = Auth::user();

        // Date range for monthly totals (defaults to current month)
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        if (!$dateFrom || !$dateTo) {
            $now = Carbon::now('Asia/Manila');
            $start = $now->copy()->startOfMonth()->toDateString();
            $end = $now->copy()->endOfMonth()->toDateString();
            $dateFrom = $dateFrom ?: $start;
            $dateTo = $dateTo ?: $end;
        }

        // Base query
        $query = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->join('divisions', 'requester.division_id', '=', 'divisions.id')
            ->select([
                DB::raw('requester.division_id as division_id'),
                DB::raw('divisions.name as division_name'),
                DB::raw("SUM(CASE WHEN requests.status IN ('pending','evaluator_approved','admin_approved') THEN 1 ELSE 0 END) as active_total"),
                DB::raw("SUM(CASE WHEN requests.status IN ('pending','evaluator_approved','admin_approved') AND requests.is_urgent = 1 THEN 1 ELSE 0 END) as active_urgent"),
                DB::raw('SUM(CASE WHEN DATE(requests.created_at) BETWEEN ? AND ? THEN 1 ELSE 0 END) as month_total')
            ])
            ->groupBy('requester.division_id', 'divisions.name')
            ->setBindings([$dateFrom, $dateTo], 'select')
        ;

        // Apply role-based scoping to match index()
        if (!$user->isAdmin()) {
            if ($user->isDivisionChief()) {
                // Division chiefs: their division
                if ($user->division_id) {
                    $query->where('requester.division_id', $user->division_id);
                } else {
                    return response()->json(['status' => 'success', 'data' => []]);
                }
            } else {
                // Regular users: only their own requests
                $query->where('requests.user_id', $user->id);
            }
        }

        $stats = $query->get();

        // Cast numeric aggregates to integers to avoid string concatenation in clients
        $stats = $stats->map(function ($r) {
            $r->active_total = (int) ($r->active_total ?? 0);
            $r->active_urgent = (int) ($r->active_urgent ?? 0);
            $r->month_total = (int) ($r->month_total ?? 0);
            return $r;
        });

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }

    /**
     * Get most requested items statistics with comparison data
     */
    public function getMostRequestedItems(Request $request)
    {
        try {
            // Get date filters
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            $limit = $request->get('limit', 10);
            
            // Calculate previous period dates
            $prevDateFrom = null;
            $prevDateTo = null;
            
            if ($dateFrom && $dateTo) {
                $fromDate = new \DateTime($dateFrom);
                $toDate = new \DateTime($dateTo);
                $periodDiff = $fromDate->diff($toDate)->days + 1;
                
                $prevToDate = clone $fromDate;
                $prevToDate->modify('-1 day');
                $prevFromDate = clone $prevToDate;
                $prevFromDate->modify("-{$periodDiff} days");
                
                $prevDateFrom = $prevFromDate->format('Y-m-d');
                $prevDateTo = $prevToDate->format('Y-m-d');
                
                // Debug logging
                Log::info('Date calculations:', [
                    'current_from' => $dateFrom,
                    'current_to' => $dateTo,
                    'period_diff_days' => $periodDiff,
                    'previous_from' => $prevDateFrom,
                    'previous_to' => $prevDateTo
                ]);
            }
            
            // Build base query for current period
            $currentQuery = DB::table('item_request')
                ->join('requests', 'item_request.request_id', '=', 'requests.id')
                ->join('items', 'item_request.item_id', '=', 'items.id')
                ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
                ->whereNotNull('requests.is_done'); // Only count requests that were actually received
            
            // Apply current period date filters
            if ($dateFrom) {
                $currentQuery->where('requests.created_at', '>=', $dateFrom . ' 00:00:00');
            }
            if ($dateTo) {
                $currentQuery->where('requests.created_at', '<=', $dateTo . ' 23:59:59');
            }
            
            // Get current period most requested items
            $currentItems = $currentQuery
                ->select([
                    'items.id',
                    'items.item_name',
                    'items.item_no',
                    'categories.name as category_name',
                    DB::raw('COUNT(DISTINCT requests.id) as request_count'),
                    DB::raw('SUM(item_request.quantity) as total_quantity_requested')
                ])
                ->groupBy('items.id', 'items.item_name', 'items.item_no', 'categories.name')
                ->orderBy('total_quantity_requested', 'desc')
                ->limit($limit)
                ->get();
            
            // Get previous period data for comparison
            $previousItems = collect();
            if ($prevDateFrom && $prevDateTo) {
                $prevQuery = DB::table('item_request')
                    ->join('requests', 'item_request.request_id', '=', 'requests.id')
                    ->join('items', 'item_request.item_id', '=', 'items.id')
                    ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
                    ->whereNotNull('requests.is_done') // Only count requests that were actually received
                    ->where('requests.created_at', '>=', $prevDateFrom . ' 00:00:00')
                    ->where('requests.created_at', '<=', $prevDateTo . ' 23:59:59');
                
                $previousItems = $prevQuery
                    ->select([
                        'items.id',
                        'items.item_name',
                        'items.item_no',
                        'categories.name as category_name',
                        DB::raw('COUNT(DISTINCT requests.id) as request_count'),
                        DB::raw('SUM(item_request.quantity) as total_quantity_requested')
                    ])
                    ->groupBy('items.id', 'items.item_name', 'items.item_no', 'categories.name')
                    ->get();
            }
            
            // Debug: Log previous items data
            Log::info('Previous items count:', ['count' => $previousItems->count()]);
            Log::info('Previous items data:', $previousItems->toArray());
            
            // Merge current and previous data
            $mergedItems = $currentItems->map(function ($currentItem) use ($previousItems) {
                $prevItem = $previousItems->firstWhere('id', $currentItem->id);
                
                return [
                    'id' => $currentItem->id,
                    'item_name' => $currentItem->item_name,
                    'item_no' => $currentItem->item_no,
                    'category_name' => $currentItem->category_name,
                    'current_request_count' => $currentItem->request_count,
                    'current_total_quantity' => $currentItem->total_quantity_requested,
                    'previous_request_count' => $prevItem ? $prevItem->request_count : 0,
                    'previous_total_quantity' => $prevItem ? $prevItem->total_quantity_requested : 0,
                ];
            });
            
            return response()->json([
                'status' => 'success',
                'data' => $mergedItems,
                'period_info' => [
                    'current_from' => $dateFrom,
                    'current_to' => $dateTo,
                    'previous_from' => $prevDateFrom,
                    'previous_to' => $prevDateTo,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching most requested items: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch most requested items statistics'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.remarks' => 'nullable|string',
            'items.*.needed_date' => 'nullable|date|after_or_equal:today',
            'is_urgent' => 'boolean',
            'remarks' => 'nullable|string',
            'needed_date' => 'nullable|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // ... existing code continues ...

        try {
            DB::beginTransaction();

            // Default values
            $evaluatorStatus = 'pending';
            $evaluatorApprovedAt = null;
            $status = 'pending';

            // ✅ If division_chief is the requester → auto evaluator approved
            if (Auth::user()->user_role === 'division_chief') {
                $evaluatorStatus = 'approved';
                $evaluatorApprovedAt = Carbon::now('Asia/Manila');
                $status = 'evaluator_approved';
            }

            // Create the request
            $requestId = DB::table('requests')->insertGetId([
                'user_id' => Auth::id(),
                'status' => $status, // ✅ use dynamic status instead of hardcoded 'pending'

                'is_urgent' => $request->input('is_urgent', false),
                'remarks' => $request->input('remarks'),
                'needed_date' => $request->input('needed_date'),
                'request_date' => Carbon::now('Asia/Manila'),
                'evaluator_status' => $evaluatorStatus,
                'evaluator_approved_at' => $evaluatorApprovedAt,
                'admin_status' => 'pending',
                'created_at' => Carbon::now('Asia/Manila'),
                'updated_at' => Carbon::now('Asia/Manila'),
            ]);

            // Insert request items
            $requestItems = [];
            foreach ($request->items as $item) {
                $requestItems[] = [
                    'request_id' => $requestId,
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'remarks' => $item['remarks'] ?? null,
                    'needed_date' => $item['needed_date'] ?? $request->input('needed_date'),
                    'created_at' => Carbon::now('Asia/Manila'),
                    'updated_at' => Carbon::now('Asia/Manila'),
                ];
            }

            DB::table('item_request')->insert($requestItems);

            DB::commit();

            // Get the created request with details
            $createdRequest = DB::table('requests')
                ->join('users as requester', 'requests.user_id', '=', 'requester.id')
                ->select([
                    'requests.*',
                    'requester.name as requester_name',
                    'requester.email as requester_email'
                ])
                ->where('requests.id', $requestId)
                ->first();

            // Log activity: request created
            $this->logCreation('Request', (int) $requestId, sprintf(
                'Created request #%d (urgent=%s) by %s',
                $requestId,
                $request->boolean('is_urgent') ? 'yes' : 'no',
                optional(Auth::user())->name
            ));

            // Log division activity
            $this->logDivisionActivity(
                'create',
                'Request',
                $requestId,
                sprintf(
                    'Created request #%d with %d items (urgent=%s)',
                    $requestId,
                    count($request->items),
                    $request->boolean('is_urgent') ? 'yes' : 'no'
                ),
                null,
                [
                    'request_id' => $requestId,
                    'items_count' => count($request->items),
                    'is_urgent' => $request->boolean('is_urgent'),
                    'status' => $status
                ]
            );

            // Create notifications for request creation
            try {
                \Log::info('Triggering notification event for request creation', [
                    'request_id' => $requestId,
                    'requester_id' => Auth::id(),
                    'requester_name' => Auth::user()->name,
                    'is_urgent' => $request->boolean('is_urgent'),
                    'status' => $status
                ]);

                $notification = $this->notificationService->notifyRequestCreated(
                    $createdRequest, // Pass the query builder result directly
                    Auth::user()
                );

                \Log::info('Notification event triggered successfully', [
                    'notification_id' => $notification->id,
                    'notification_type' => $notification->type,
                    'broadcast_channel' => 'user.' . $notification->user_id
                ]);

                // Note: Broadcasting is handled within the notificationService->notifyRequestCreated() method

            } catch (\Exception $e) {
                \Log::error('Failed to create notification for request creation', [
                    'request_id' => $requestId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                // Don't fail the request creation if notification fails
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Request created successfully',
                'data' => $createdRequest
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create request',
                'error' => $e->getMessage()
            ], 500);
        }
    }




    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $request = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('users as evaluator', 'requests.evaluator_id', '=', 'evaluator.id')
            ->leftJoin('users as admin', 'requests.admin_id', '=', 'admin.id')
            ->select([
                'requests.*',
                'requests.ready_for_pickup', // <-- add this
                'requester.name as requester_name',
                'requester.email as requester_email',
                'requester.division_id as requester_division_id',
                'evaluator.name as evaluator_name',
                'admin.name as admin_name'
            ])
            ->where('requests.id', $id)
            ->first();

        if (!$request) {
            return response()->json([
                'status' => 'error',
                'message' => 'Request not found'
            ], 404);
        }

        // Check if user has permission to view this request
        $authUser = Auth::user();
        $isOwner = ($request->user_id === $authUser->id);
        $isDivisionChiefOfRequester = ($authUser->isDivisionChief() && $authUser->division_id && $authUser->division_id === $request->requester_division_id);
        $isFocalPersonOfRequester = ($authUser->user_role === 'focal_person' && $authUser->division_id === $request->requester_division_id);

        if (!$authUser->isAdmin() && !$isOwner && !$isDivisionChiefOfRequester && !$isFocalPersonOfRequester) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        // Get request items
        $requestItems = DB::table('item_request')
            ->join('items', 'item_request.item_id', '=', 'items.id')
            ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
            ->select([
                'item_request.*',
                'items.item_name',
                'items.item_no',
                'items.description',
                'items.quantity_on_hand',
                'categories.name as category_name'
            ])
            ->where('item_request.request_id', $id)
            ->get();

        $request->items = $requestItems;

        return response()->json([
            'status' => 'success',
            'data' => $request
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
public function update(Request $request, string $id)
{
    $existingRequest = DB::table('requests')
        ->join('users', 'requests.user_id', '=', 'users.id')
        ->select('requests.*', 'users.id as owner_id', 'users.user_role as owner_role')
        ->where('requests.id', $id)
        ->first();

    if (!$existingRequest) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Request not found'
        ], 404);
    }

$user = Auth::user();

// Admins bypass all checks
if ($user->user_role === 'admin') {
    // allowed
} elseif ($user->id === $existingRequest->owner_id) {
    // request owner can always cancel
} elseif ($user->user_role === 'focal_person' && $existingRequest->owner_role === 'division_chief') {
    // ❌ focal_person cannot cancel division chief’s requests
    return response()->json([
        'status'  => 'error',
        'message' => 'You are not authorized to cancel a request submitted by the Division Chief. Please coordinate with your Division Chief for this action.'
    ], 403);
} elseif ($user->user_role === 'division_chief' && $existingRequest->owner_role === 'focal_person') {
    // ✅ division chief can cancel focal_person requests
    // allowed
} else {
    return response()->json([
        'status'  => 'error',
        'message' => 'Unauthorized'
    ], 403);
}


    /**
     * Handle Cancel Action
     */
    if ($request->has('action') && $request->action === 'cancel') {
        if (in_array($existingRequest->status, ['cancelled', 'completed', 'rejected'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cannot cancel a request with status: ' . $existingRequest->status
            ], 400);
        }

        $cancelData = [
            'status'     => 'cancelled',
            'updated_at' => Carbon::now()
        ];

        if ($request->has('cancel_remarks') && !empty($request->cancel_remarks)) {
            $cancelData['admin_remarks'] = $request->cancel_remarks;
        }

        $updated = DB::table('requests')
            ->where('id', $id)
            ->update($cancelData);

        if (!$updated) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to cancel request'
            ], 500);
        }

        // Log cancellation
        Log::info('Request cancelled', [
            'request_id'   => $id,
            'cancelled_by' => $user->id,
            'status'       => 'cancelled',
            'remarks'      => $request->cancel_remarks ?? null
        ]);

        // Log division activity for cancellation
        $this->logDivisionActivity(
            'cancel',
            'Request',
            $id,
            sprintf(
                'Cancelled request #%d%s',
                $id,
                $request->cancel_remarks ? ' - ' . $request->cancel_remarks : ''
            ),
            ['status' => $existingRequest->status],
            ['status' => 'cancelled']
        );

        // Return updated request with requester details
        $updatedRequest = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->select([
                'requests.*',
                'requester.name as requester_name',
                'requester.email as requester_email'
            ])
            ->where('requests.id', $id)
            ->first();

        // Log activity: request updated (only fields changed)
        $changed = array_keys($cancelData);
        $this->logUpdate('Request', (int) $id, 'Updated fields: ' . implode(',', $changed));

        return response()->json([
            'status'  => 'success',
            'message' => 'Request cancelled successfully',
            'data'    => $updatedRequest
        ]);
    }

    /**
     * Handle Regular Update
     */
    $validator = Validator::make($request->all(), [
        'is_urgent'      => 'boolean',
        'remarks'        => 'nullable|string',
        'needed_date'    => 'nullable|date|after_or_equal:today',
        'action'         => 'nullable|string',
        'cancel_remarks' => 'nullable|string',
        'status'         => 'nullable|string'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Validation failed',
            'errors'  => $validator->errors()
        ], 422);
    }

    if (!in_array($existingRequest->status, ['pending', 'evaluator_approved'])) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Cannot update request unless it is pending or evaluator approved'
        ], 400);
    }

    $updateData = [];
    if ($request->has('is_urgent')) $updateData['is_urgent'] = $request->is_urgent;
    if ($request->has('remarks')) $updateData['remarks'] = $request->remarks;
    if ($request->has('needed_date')) $updateData['needed_date'] = $request->needed_date;
    $updateData['updated_at'] = Carbon::now();

    $updated = DB::table('requests')->where('id', $id)->update($updateData);

    if (!$updated) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Failed to update request'
        ], 500);
    }

    $updatedRequest = DB::table('requests')
        ->join('users as requester', 'requests.user_id', '=', 'requester.id')
        ->select([
            'requests.*',
            'requester.name as requester_name',
            'requester.email as requester_email'
        ])
        ->where('requests.id', $id)
        ->first();

    // Log division activity for update
    if (!empty($updateData)) {
        $this->logDivisionActivity(
            'update',
            'Request',
            $id,
            sprintf(
                'Updated request #%d fields: %s',
                $id,
                implode(', ', array_keys(array_diff_key($updateData, ['updated_at' => ''])))
            ),
            $existingRequest ? array_intersect_key((array)$existingRequest, $updateData) : null,
            $updateData
        );
    }

    return response()->json([
        'status'  => 'success',
        'message' => 'Request updated successfully',
        'data'    => $updatedRequest
    ]);
}


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $request = DB::table('requests')->where('id', $id)->first();

        if (!$request) {
            return response()->json([
                'status' => 'error',
                'message' => 'Request not found'
            ], 404);
        }

        // Check permissions
        if (!Auth::user()->isAdmin() && $request->user_id !== Auth::id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        // Only allow deletion if request is pending
        if ($request->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete request that is not pending'
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Delete request items first
            DB::table('item_request')->where('request_id', $id)->delete();

            // Delete the request
            DB::table('requests')->where('id', $id)->delete();

            DB::commit();

            // Log activity: request deleted
            $this->logDeletion('Request', (int) $id, sprintf('Deleted request #%d by %s', $id, optional(Auth::user())->name));

            // Log division activity for deletion
            $this->logDivisionActivity(
                'delete',
                'Request',
                $id,
                sprintf('Deleted request #%d', $id),
                ['status' => $request->status, 'user_id' => $request->user_id],
                null
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Request deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Evaluate a request (for division chiefs)
     */
    public function evaluate(Request $request, string $id)
    {
        $existingRequest = DB::table('requests')->where('id', $id)->first();

        if (!$existingRequest) {
            return response()->json([
                'status' => 'error',
                'message' => 'Request not found'
            ], 404);
        }

        // Only division chiefs can evaluate, and only within their division
        $authUser = Auth::user();
        if (!$authUser->isDivisionChief()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        // Ensure the request belongs to the division chief's division
        $requesterDivisionId = DB::table('users')->where('id', $existingRequest->user_id)->value('division_id');
        if (!$authUser->division_id || $authUser->division_id !== $requesterDivisionId) {
            return response()->json([
                'status' => 'error',
                'message' => 'You can only evaluate requests from your division'
            ], 403);
        }

        // Prevent re-evaluation once completed
        if (isset($existingRequest->evaluator_status) && $existingRequest->evaluator_status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'This request has already been evaluated'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'evaluator_status' => 'required|in:approved,rejected',
            'evaluator_remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = [
            'evaluator_id' => Auth::id(),
            'evaluator_status' => $request->evaluator_status,
            'evaluator_remarks' => $request->evaluator_remarks,
            'updated_at' => Carbon::now('Asia/Manila'),
        ];

        // Add timestamp if division chief approves
        if ($request->evaluator_status === 'approved') {
            $updateData['status'] = 'evaluator_approved';
            $updateData['evaluator_approved_at'] = Carbon::now('Asia/Manila');
        } else {
            $updateData['status'] = 'rejected';
            $updateData['admin_status'] = 'rejected'; // Automatically reject admin_status as well
        }

        DB::table('requests')
            ->where('id', $id)
            ->update($updateData);

        $updatedRequest = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('users as evaluator', 'requests.evaluator_id', '=', 'evaluator.id')
            ->select([
                'requests.*',
                'requester.name as requester_name',
                'evaluator.name as evaluator_name'
            ])
            ->where('requests.id', $id)
            ->first();

        // Log activity: request evaluated
        $this->logActivity(
            $request->evaluator_status === 'approved' ? 'evaluate_approve' : 'evaluate_reject',
            'Request',
            (int) $id,
            'Evaluator ' . optional(Auth::user())->name . ' set status to ' . $request->evaluator_status
        );

        // Log division activity for evaluation
        $this->logDivisionActivity(
            $request->evaluator_status === 'approved' ? 'evaluate_approve' : 'evaluate_reject',
            'Request',
            $id,
            sprintf(
                'Division Chief %s %s request #%d%s',
                optional(Auth::user())->name,
                $request->evaluator_status === 'approved' ? 'approved' : 'rejected',
                $id,
                $request->evaluator_remarks ? ' - ' . $request->evaluator_remarks : ''
            ),
            ['evaluator_status' => 'pending'],
            ['evaluator_status' => $request->evaluator_status, 'status' => $updateData['status']]
        );

        // Create notifications for evaluation result
        try {
            if ($request->evaluator_status === 'approved') {
                $this->notificationService->notifyRequestApproved(
                    $updatedRequest,
                    Auth::user(),
                    'evaluator'
                );
            } else {
                $this->notificationService->notifyRequestRejected(
                    $updatedRequest,
                    Auth::user(),
                    $request->evaluator_remarks,
                    'evaluator'
                );
            }
        } catch (\Exception $e) {
            Log::warning('Failed to create notification for request evaluation: ' . $e->getMessage());
            // Don't fail the evaluation if notification fails
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Request evaluated successfully',
            'data' => $updatedRequest
        ]);
    }



    /**
     * Approve/reject a request (for admins)
     */
    public function approve(Request $request, string $id)
    {
        $existingRequest = DB::table('requests')->where('id', $id)->first();

        if (!$existingRequest) {
            return response()->json([
                'status' => 'error',
                'message' => 'Request not found'
            ], 404);
        }

        // Only admins can approve/reject
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'admin_status' => 'required|in:approved,rejected',
            'admin_remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Map admin_status to the actual enum value in 'status'
        $status = $request->admin_status === 'approved' ? 'admin_approved' : 'rejected';

        $updateData = [
            'admin_id' => Auth::id(),
            'admin_status' => $request->admin_status,
            'admin_remarks' => $request->admin_remarks,
            'status' => $status,
            'updated_at' => Carbon::now('Asia/Manila'),
        ];

        // Add timestamp if admin approves
        if ($request->admin_status === 'approved') {
            $updateData['admin_approved_at'] = Carbon::now('Asia/Manila');
        }

        DB::table('requests')
            ->where('id', $id)
            ->update($updateData);

        $updatedRequest = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('users as admin', 'requests.admin_id', '=', 'admin.id')
            ->select([
                'requests.*',
                'requester.name as requester_name',
                'admin.name as admin_name'
            ])
            ->where('requests.id', $id)
            ->first();

        // Log activity: request approved or rejected by admin
        $this->logActivity(
            $request->admin_status === 'approved' ? 'admin_approve' : 'admin_reject',
            'Request',
            (int) $id,
            'Admin ' . optional(Auth::user())->name . ' set admin_status to ' . $request->admin_status
        );

        // Get requester's division for division logging
        $requesterDivisionId = DB::table('users')->where('id', $existingRequest->user_id)->value('division_id');
        
        // Log division activity for admin approval/rejection
        if ($requesterDivisionId) {
            try {
                DivisionLog::logDivisionActivity(
                    $requesterDivisionId,
                    Auth::id(),
                    $request->admin_status === 'approved' ? 'admin_approve' : 'admin_reject',
                    'Request',
                    $id,
                    sprintf(
                        'Admin %s %s request #%d%s',
                        optional(Auth::user())->name,
                        $request->admin_status === 'approved' ? 'approved' : 'rejected',
                        $id,
                        $request->admin_remarks ? ' - ' . $request->admin_remarks : ''
                    ),
                    ['admin_status' => 'pending'],
                    ['admin_status' => $request->admin_status, 'status' => $status],
                    request()->ip(),
                    request()->userAgent()
                );
            } catch (\Exception $e) {
                Log::error('Failed to log division activity for admin approval: ' . $e->getMessage());
            }
        }

        // Create notifications for admin approval/rejection
        try {
            if ($request->admin_status === 'approved') {
                $this->notificationService->notifyRequestApproved(
                    $updatedRequest,
                    Auth::user(),
                    'admin'
                );
            } else {
                $this->notificationService->notifyRequestRejected(
                    $updatedRequest,
                    Auth::user(),
                    $request->admin_remarks,
                    'admin'
                );
            }
        } catch (\Exception $e) {
            Log::warning('Failed to create notification for admin approval: ' . $e->getMessage());
            // Don't fail the approval if notification fails
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Request processed successfully',
            'data' => $updatedRequest
        ]);
    }



    /**
     * Get request statistics
     */
    public function getStats()
    {
        // Align with actual workflow statuses
        $stats = DB::table('requests')
            ->selectRaw(
                'COUNT(*) as total_requests,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_requests,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as under_review_requests,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as approved_requests,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as rejected_requests,
                 SUM(CASE WHEN is_urgent = 1 THEN 1 ELSE 0 END) as urgent_requests',
                ['pending', 'evaluator_approved', 'admin_approved', 'rejected']
            )
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }

    /**
     * Get requests by user
     */
    public function getUserRequests(Request $request)
    {
        $userId = $request->input('user_id', Auth::id());

        // Only admins can view other users' requests
        if ($userId !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $query = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->select([
                'requests.*',
                'requester.name as requester_name',
                'requester.email as requester_email'
            ])
            ->where('requests.user_id', $userId);

        // Apply filters
        if ($request->has('status') && $request->status) {
            $query->where('requests.status', $request->status);
        }

        if ($request->has('is_urgent') && $request->is_urgent !== null) {
            $query->where('requests.is_urgent', $request->is_urgent);
        }



        // Sort and paginate
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy("requests.{$sortField}", $sortDirection);

        $perPage = $request->input('per_page', 15);
        $requests = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $requests->items(),
            'current_page' => $requests->currentPage(),
            'last_page' => $requests->lastPage(),
            'per_page' => $requests->perPage(),
            'total' => $requests->total(),
            'from' => $requests->firstItem(),
            'to' => $requests->lastItem()
        ]);
    }

    /**
     * Get requests by division of logged-in user
     */
public function myDivisionRequests(Request $request)
{
    $user = Auth::user();

    if (!$user->division_id) {
        \Log::error('User has no division_id assigned: ' . $user->id);
        return response()->json([
            'status' => 'error',
            'message' => 'User has no division assigned'
        ], 404);
    }

    $userDivision = DB::table('divisions')
        ->where('id', $user->division_id)
        ->select('id as division_id', 'name as division_name')
        ->first();

    if (!$userDivision) {
        \Log::error("Division not found for user {$user->id} with division_id {$user->division_id}");
        return response()->json([
            'status' => 'success',
            'data' => [],
            'division' => null,
            'message' => 'No division found for user'
        ]);
    }

    $query = DB::table('requests')
        ->join('users as requester', 'requests.user_id', '=', 'requester.id')
        ->leftJoin('users as evaluator', 'requests.evaluator_id', '=', 'evaluator.id')
        ->leftJoin('users as admin', 'requests.admin_id', '=', 'admin.id')
        ->select([
            'requests.*',
            'requests.ready_for_pickup', // include ready_for_pickup
            'requester.name as requester_name',
            'requester.email as requester_email',
            'evaluator.name as evaluator_name',
            'admin.name as admin_name'
        ])
        ->where('requester.division_id', $userDivision->division_id);

    // Apply filters
    if ($request->filled('status')) {
        $query->where('requests.status', $request->status);
    }

    if ($request->filled('is_urgent')) {
        $query->where('requests.is_urgent', $request->is_urgent);
    }

    if ($request->filled('date_from')) {
        $query->where('requests.created_at', '>=', $request->date_from);
    }

    if ($request->filled('date_to')) {
        $query->where('requests.created_at', '<=', $request->date_to);
    }

    // ADD SEARCH FUNCTIONALITY HERE
    if ($request->filled('search')) {
        $searchTerm = $request->search;
        $query->where(function($q) use ($searchTerm) {
            $q->where('requests.remarks', 'LIKE', "%{$searchTerm}%")
              ->orWhere('requester.name', 'LIKE', "%{$searchTerm}%")
              ->orWhere('requester.email', 'LIKE', "%{$searchTerm}%")
              ->orWhere('requests.id', 'LIKE', "%{$searchTerm}%")
              ->orWhereExists(function($itemQuery) use ($searchTerm) {
                  $itemQuery->select(DB::raw(1))
                           ->from('item_request')
                           ->join('items', 'item_request.item_id', '=', 'items.id')
                           ->whereColumn('item_request.request_id', 'requests.id')
                           ->where(function($itemWhere) use ($searchTerm) {
                               $itemWhere->where('items.item_name', 'LIKE', "%{$searchTerm}%")
                                        ->orWhere('items.item_no', 'LIKE', "%{$searchTerm}%")
                                        ->orWhere('items.description', 'LIKE', "%{$searchTerm}%");
                           });
              });
        });
    }

    // Sorting
    $sortField = $request->input('sort_field', 'created_at');
    $sortDirection = $request->input('sort_direction', 'desc');
    $allowedSortFields = ['created_at', 'status', 'is_urgent', 'needed_date'];

    if (in_array($sortField, $allowedSortFields)) {
        $query->orderBy("requests.{$sortField}", $sortDirection);
    }

    $perPage = $request->input('per_page', 10);
    $page = $request->input('page', 1);
    $requests = $query->paginate($perPage, ['*'], 'page', $page);

    // Attach items and compute display_status
    foreach ($requests->items() as $requestRow) {
        $items = DB::table('item_request')
            ->join('items', 'item_request.item_id', '=', 'items.id')
            ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
            ->select([
                'item_request.*',
                'items.item_name',
                'items.item_no',
                'items.description',
                'items.quantity_on_hand',
                'categories.name as category_name'
            ])
            ->where('item_request.request_id', $requestRow->id)
            ->get();

        $requestRow->items = $items;

        // Compute display_status - Always check cancelled first
        if ($requestRow->status === 'cancelled') {
            $requestRow->display_status = 'Cancelled';
        } elseif ($requestRow->ready_for_pickup == 1) {
            $requestRow->display_status = 'Completed';
        } elseif (is_null($requestRow->evaluator_status) || $requestRow->evaluator_status === 'pending') {
            $requestRow->display_status = 'Awaiting Division Chief Approval';
        } elseif ($requestRow->evaluator_status === 'approved' &&
                  (is_null($requestRow->admin_status) || $requestRow->admin_status === 'pending')) {
            $requestRow->display_status = 'Awaiting Admin Approval';
        } elseif ($requestRow->evaluator_status === 'approved' &&
                  $requestRow->admin_status === 'approved' &&
                  $requestRow->ready_for_pickup == 0) {
            $requestRow->display_status = 'Admin is preparing the items';
        } else {
            $requestRow->display_status = $requestRow->status;
        }
    }

    return response()->json([
        'status' => 'success',
        'data' => $requests->items(),
        'current_page' => $requests->currentPage(),
        'last_page' => $requests->lastPage(),
        'per_page' => $requests->perPage(),
        'total' => $requests->total(),
        'from' => $requests->firstItem(),
        'to' => $requests->lastItem(),
        'division' => [
            'id' => $userDivision->division_id,
            'name' => $userDivision->division_name
        ]
    ]);
}

    public function getRequestStats()
    {
        $user = Auth::user();

        // Base query
        $requestsQuery = DB::table('requests');

        if ($user->user_role === 'division_chief') {
            // Division chiefs see only their division's requests
            $requestsQuery->join('users', 'requests.user_id', '=', 'users.id')
                ->where('users.division_id', $user->division_id);

        } elseif ($user->user_role === 'admin') {
            // Admins see only requests where admin_status is pending and evaluator_status is approved
            $requestsQuery->where('admin_status', 'pending')
                ->where('evaluator_status', 'approved');

        } else {
            // Non-admins & non-division chiefs see only their own requests
            $requestsQuery->where('user_id', $user->id);
        }

        // Count stats
        $total_requests = (clone $requestsQuery)->count();

        if ($user->user_role === 'admin') {
            // Admin's pending definition = evaluator approved & admin pending
            $pending_requests = (clone $requestsQuery)
                ->where('admin_status', 'pending')
                ->where('evaluator_status', 'approved')
                ->count();

        } elseif ($user->user_role === 'division_chief') {
            // Division chief's pending definition = evaluator_status pending
            $pending_requests = (clone $requestsQuery)
                ->where('evaluator_status', 'pending')
                ->count();

        } else {
            // Regular users = status pending
            $pending_requests = (clone $requestsQuery)
                ->where('status', 'pending')
                ->count();
        }

        $approved_requests = (clone $requestsQuery)
            ->where('admin_status', 'approved')
            ->count();

        if ($user->user_role === 'division_chief') {
            // For division chiefs, urgent requests should exclude evaluator-approved
            $urgent_requests = (clone $requestsQuery)
                ->where('is_urgent', true)
                ->where('admin_status', '!=', 'approved')
                ->where('evaluator_status', 'pending') // only count if evaluator still pending
                ->count();
        } else {
            $urgent_requests = (clone $requestsQuery)
                ->where('is_urgent', true)
                ->where('admin_status', '!=', 'approved')
                ->count();
        }

        return response()->json([
            'total_requests' => $total_requests,
            'pending_requests' => $pending_requests,
            'approved_requests' => $approved_requests,
            'urgent_requests' => $urgent_requests,
        ]);
    }





    /**
     * Get current supplies for a specific division
     */
    public function getDivisionSupplies(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'division_id' => 'required|exists:divisions,id',
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:available,low_stock,out_of_stock',
            'category_id' => 'nullable|exists:categories,id',
            'sort_field' => 'nullable|in:item_name,category,quantity,date_received,property_no',
            'sort_direction' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $divisionId = $request->division_id;
        $search = $request->search;
        $status = $request->status;
        $categoryId = $request->category_id;
        $sortField = $request->input('sort_field', 'item_name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        // Build the query for division supplies
        $query = DB::table('division_supplies')
            ->join('items', 'division_supplies.item_id', '=', 'items.id')
            ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
            ->leftJoin('divisions', 'division_supplies.division_id', '=', 'divisions.id')
            ->select([
                'division_supplies.*',
                'items.item_name',
                'items.item_no',
                'items.description',
                'items.quantity_on_hand as total_quantity',
                'categories.name as category_name',
                'divisions.name as division_name'
            ])
            ->where('division_supplies.division_id', $divisionId);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('items.item_name', 'LIKE', "%{$search}%")
                    ->orWhere('items.item_no', 'LIKE', "%{$search}%")
                    ->orWhere('items.description', 'LIKE', "%{$search}%")
                    ->orWhere('division_supplies.property_no', 'LIKE', "%{$search}%")
                    ->orWhere('categories.name', 'LIKE', "%{$search}%");
            });
        }

        // Apply status filter
        if ($status) {
            switch ($status) {
                case 'low_stock':
                    $query->where('division_supplies.quantity', '<=', DB::raw('division_supplies.reorder_point'));
                    break;
                case 'out_of_stock':
                    $query->where('division_supplies.quantity', '=', 0);
                    break;
                case 'available':
                    $query->where('division_supplies.quantity', '>', 0);
                    break;
            }
        }

        // Apply category filter
        if ($categoryId) {
            $query->where('items.category_id', $categoryId);
        }

        // Apply sorting
        $allowedSortFields = ['item_name', 'category', 'quantity', 'date_received', 'property_no'];
        if (in_array($sortField, $allowedSortFields)) {
            $sortColumn = $sortField === 'category' ? 'categories.name' :
                ($sortField === 'date_received' ? 'division_supplies.date_received' :
                    ($sortField === 'property_no' ? 'division_supplies.property_no' :
                        "division_supplies.{$sortField}"));
            $query->orderBy($sortColumn, $sortDirection);
        }

        // Get paginated results
        $supplies = $query->paginate($perPage, ['*'], 'page', $page);

        // Calculate additional statistics for the division
        $divisionStats = DB::table('division_supplies')
            ->where('division_id', $divisionId)
            ->selectRaw('
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity,
                SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
                SUM(CASE WHEN quantity <= reorder_point AND quantity > 0 THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN quantity > reorder_point THEN 1 ELSE 0 END) as available_count
            ')
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $supplies->items(),
            'pagination' => [
                'current_page' => $supplies->currentPage(),
                'last_page' => $supplies->lastPage(),
                'per_page' => $supplies->perPage(),
                'total' => $supplies->total(),
                'from' => $supplies->firstItem(),
                'to' => $supplies->lastItem()
            ],
            'division_stats' => $divisionStats,
            'filters' => [
                'division_id' => $divisionId,
                'search' => $search,
                'status' => $status,
                'category_id' => $categoryId,
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection
            ]
        ]);
    }

    /**
     * Get all supplies for the currently logged-in user's division
     */
  public function getCurrentUserDivisionSupplies(Request $request)
{
    $userDivisionId = auth()->user()->division_id;

    // Base query joining requests, item requests, items, categories, and users
    $query = DB::table('item_request')
        ->join('requests', 'item_request.request_id', '=', 'requests.id')
        ->join('users', 'requests.user_id', '=', 'users.id')
        ->join('items', 'item_request.item_id', '=', 'items.id')
        ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
        ->where('users.division_id', $userDivisionId)
        ->where('requests.admin_status', 'approved')
        ->whereNotNull('requests.is_done'); // Only where is_done is not null

    // Enhanced search filters
    if ($request->search) {
        $searchTerm = '%' . $request->search . '%';
        $query->where(function($q) use ($searchTerm) {
            $q->where('items.item_name', 'like', $searchTerm)
              ->orWhere('items.item_no', 'like', $searchTerm)  // Property/Item number
              ->orWhere('items.description', 'like', $searchTerm)  // Description/remarks
              ->orWhere('categories.name', 'like', $searchTerm)  // Category name
              ->orWhere('items.supplier', 'like', $searchTerm);  // Supplier (if this field exists)
        });
    }

    if ($request->category_id) {
        $query->where('items.category_id', $request->category_id);
    }

    // Group by item ID and sum quantities to consolidate duplicate items
    $query->groupBy(
        'items.id',
        'items.item_no',
        'items.item_name',
        'categories.name',
        'items.description',
        'items.unit',
        'items.category_id',
        'items.reorder_level',
        'items.reorder_quantity',
        'items.supplier',
        'items.location',
        'items.created_at',
        'items.updated_at'
    );

    // Calculate total quantity for each item
    $query->selectRaw('
        items.id,
        items.item_no,
        items.item_name,
        categories.name as category_name,
        items.description,
        SUM(item_request.quantity) as quantity_on_hand,
        items.unit,
        SUM(item_request.quantity) as requested_quantity,
        MAX(requests.is_done) as is_done,
        items.category_id,
        items.reorder_level,
        items.reorder_quantity,
        items.supplier,
        items.location,
        items.created_at,
        items.updated_at
    ');

    // Apply status filter after grouping
    if ($request->status) {
        $query->havingRaw('SUM(item_request.quantity) ' . $this->getStatusCondition($request->status));
    }

    // Sorting
    $sortField = $request->sort_field ?? 'items.item_name';
    $sortDirection = $request->sort_direction ?? 'asc';
    $query->orderBy($sortField, $sortDirection);

    // Pagination
    $perPage = $request->per_page ?? 10;
    $data = $query->paginate($perPage);

    // Division stats - need to use grouped data for accurate counts
    $statsQuery = DB::table('item_request')
        ->join('requests', 'item_request.request_id', '=', 'requests.id')
        ->join('users', 'requests.user_id', '=', 'users.id')
        ->join('items', 'item_request.item_id', '=', 'items.id')
        ->where('users.division_id', $userDivisionId)
        ->where('requests.admin_status', 'approved')
        ->whereNotNull('requests.is_done')
        ->groupBy('items.id')
        ->selectRaw('
            items.id,
            SUM(item_request.quantity) as total_quantity,
            items.reorder_level
        ');

    $groupedStats = $statsQuery->get();
    
    $divisionStats = [
        'total_items' => $groupedStats->count(),
        'total_requested_quantity' => $groupedStats->sum('total_quantity'),
        'out_of_stock_count' => $groupedStats->where('total_quantity', 0)->count(),
        'low_stock_count' => $groupedStats->where('total_quantity', '>', 0)
            ->where('total_quantity', '<=', 5)->count(),
        'available_count' => $groupedStats->where('total_quantity', '>', 0)->count(),
    ];

    // Category breakdown - also needs to be grouped
    $categoryBreakdown = DB::table('item_request')
        ->join('requests', 'item_request.request_id', '=', 'requests.id')
        ->join('users', 'requests.user_id', '=', 'users.id')
        ->join('items', 'item_request.item_id', '=', 'items.id')
        ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
        ->where('users.division_id', $userDivisionId)
        ->where('requests.admin_status', 'approved')
        ->whereNotNull('requests.is_done')
        ->groupBy('categories.id', 'categories.name')
        ->selectRaw('
            categories.id,
            categories.name,
            COUNT(DISTINCT items.id) as item_count,
            SUM(item_request.quantity) as total_quantity
        ')
        ->get();

    return response()->json([
        'status' => 'success',
        'data' => $data->items(),
        'pagination' => [
            'current_page' => $data->currentPage(),
            'last_page' => $data->lastPage(),
            'per_page' => $data->perPage(),
            'total' => $data->total(),
            'from' => $data->firstItem(),
            'to' => $data->lastItem(),
        ],
        'division_stats' => $divisionStats,
        'category_breakdown' => $categoryBreakdown,
        'user_division' => [
            'id' => $userDivisionId,
            'name' => auth()->user()->division->name ?? null,
        ],
        'filters' => [
            'search' => $request->search ?? null,
            'status' => $request->status ?? null,
            'category_id' => $request->category_id ?? null,
            'sort_field' => $sortField,
            'sort_direction' => $sortDirection,
        ],
    ]);
}

    /**
     * Helper method to get status condition for HAVING clause
     */
    private function getStatusCondition($status)
    {
        switch ($status) {
            case 'out-of-stock':
                return '= 0';
            case 'low-stock':
                return '> 0 AND SUM(item_request.quantity) <= 5';
            case 'in-stock':
                return '> 5';
            default:
                return '>= 0'; // Show all if status is not recognized
        }
    }

    /**
     * Get request timeline
     */
    public function getRequestTimeline(string $id)
    {
        try {
            $request = DB::table('requests')
                ->join('users as requester', 'requests.user_id', '=', 'requester.id')
                ->leftJoin('users as evaluator', 'requests.evaluator_id', '=', 'evaluator.id')
                ->leftJoin('users as admin', 'requests.admin_id', '=', 'admin.id')
                ->select([
                    'requests.*',
                    'requester.name as requester_name',
                    'evaluator.name as evaluator_name',
                    'admin.name as admin_name'
                ])
                ->where('requests.id', $id)
                ->first();

            if (!$request) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Request not found'
                ], 404);
            }

            $timeline = [];

            // Event 1: Request Created
            $timeline[] = [
                'event_type' => 'created',
                'description' => 'Request created',
                'timestamp' => $request->created_at,
                'user_name' => $request->requester_name,
                'status' => 'pending',
                'remarks' => $request->remarks
            ];

            // Event 2: Request Submitted (if updated)
            if ($request->created_at !== $request->updated_at) {
                $timeline[] = [
                    'event_type' => 'submitted',
                    'description' => 'Request submitted for review',
                    'timestamp' => $request->updated_at,
                    'user_name' => $request->requester_name,
                    'status' => 'pending'
                ];
            }

            // Event 3: Evaluator Review
            if ($request->evaluator_id && $request->evaluator_status !== 'pending') {
                $timeline[] = [
                    'event_type' => 'evaluated',
                    'description' => $request->evaluator_status === 'approved' ? 'Request approved by evaluator' : 'Request rejected by evaluator',
                    'timestamp' => $request->evaluator_approved_at ?? $request->updated_at,
                    'user_name' => $request->evaluator_name,
                    'status' => $request->evaluator_status,
                    'remarks' => $request->evaluator_remarks
                ];
            }

            // Event 4: Admin Review
            if ($request->admin_id && $request->admin_status !== 'pending') {
                $timeline[] = [
                    'event_type' => $request->admin_status === 'approved' ? 'approved' : 'rejected',
                    'description' => $request->admin_status === 'approved' ? 'Request approved by administrator' : 'Request rejected by administrator',
                    'timestamp' => $request->admin_approved_at ?? $request->updated_at,
                    'user_name' => $request->admin_name,
                    'status' => $request->admin_status,
                    'remarks' => $request->admin_remarks
                ];
            }

            // Event 5: Status Changes (only if not already captured)
            if ($request->status !== 'pending' && !in_array($request->status, ['evaluator_approved', 'admin_approved'])) {
                $statusDescription = match ($request->status) {
                    'under_review' => 'Request moved to review',
                    'approved' => 'Request fully approved',
                    'rejected' => 'Request rejected',
                    default => 'Request status updated'
                };

                $timeline[] = [
                    'event_type' => 'status_changed',
                    'description' => $statusDescription,
                    'timestamp' => $request->updated_at,
                    'user_name' => $request->admin_name ?? $request->evaluator_name ?? 'System',
                    'status' => $request->status
                ];
            }

            // Event 6: Urgency Changes
            if ($request->is_urgent) {
                $timeline[] = [
                    'event_type' => 'marked_urgent',
                    'description' => 'Request marked as urgent',
                    'timestamp' => $request->created_at,
                    'user_name' => $request->requester_name,
                    'status' => 'urgent'
                ];
            }

            // Sort timeline by timestamp
            usort($timeline, fn($a, $b) => strtotime($a['timestamp']) - strtotime($b['timestamp']));

            // Re-index IDs
            foreach ($timeline as $index => $event) {
                $timeline[$index]['id'] = $index + 1;
            }

            return response()->json([
                'status' => 'success',
                'data' => $timeline
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve request timeline: ' . $e->getMessage()
            ], 500);
        }
    }

public function markReadyForPickup($id)
{
    // Check if the request exists
    $requestExists = DB::table('requests')->where('id', $id)->exists();

    if (!$requestExists) {
        return response()->json([
            'status' => 'error',
            'message' => 'Request not found',
        ], 404);
    }

    // Get the request items before updating
    $requestItems = DB::table('item_request')
        ->where('request_id', $id)
        ->get();

    // Deduct quantity from items
    foreach ($requestItems as $requestItem) {
        DB::table('items')
            ->where('id', $requestItem->item_id)
            ->decrement('quantity_on_hand', $requestItem->quantity);
    }

    // Update the ready_for_pickup flag to 1
    DB::table('requests')
        ->where('id', $id)
        ->update(['ready_for_pickup' => 1, 'updated_at' => now()]);

    // Retrieve the updated request
    $updatedRequest = DB::table('requests')->where('id', $id)->first();

    // Log activity
    $this->logActivity(
        'mark_ready_for_pickup',
        'Request',
        (int) $id,
        'Marked as ready for pickup by ' . optional(Auth::user())->name
    );

    // Get requester's division for division logging
    $requesterDivisionId = DB::table('requests')
        ->join('users', 'requests.user_id', '=', 'users.id')
        ->where('requests.id', $id)
        ->value('users.division_id');
    
    // Log division activity for ready for pickup
    if ($requesterDivisionId) {
        try {
            DivisionLog::logDivisionActivity(
                $requesterDivisionId,
                Auth::id(),
                'mark_ready_for_pickup',
                'Request',
                $id,
                sprintf('Request #%d marked as ready for pickup by %s', $id, optional(Auth::user())->name),
                ['ready_for_pickup' => 0],
                ['ready_for_pickup' => 1],
                request()->ip(),
                request()->userAgent()
            );
        } catch (\Exception $e) {
            Log::error('Failed to log division activity for ready for pickup: ' . $e->getMessage());
        }
    }

    return response()->json([
        'status' => 'success',
        'message' => "Request #{$id} marked as ready for pickup",
        'data' => $updatedRequest,
    ]);
}

  // In your controller
public function markAsReceived(Request $request, $id)
{
    $validated = $request->validate([
        'received_by' => 'required|string|max:255',
    ]);

    // Get request details before updating for logging
    $requestData = DB::table('requests')
        ->join('users', 'requests.user_id', '=', 'users.id')
        ->join('divisions', 'users.division_id', '=', 'divisions.id')
        ->where('requests.id', $id)
        ->select('requests.*', 'users.name as requester_name', 'users.division_id', 'divisions.name as division_name')
        ->first();

    if (!$requestData) {
        return response()->json([
            'status' => 'error',
            'message' => 'Request not found',
        ], 404);
    }


    DB::table('requests')
        ->where('id', $id)
        ->update([
            'received_by' => $validated['received_by'],
            'is_done' => now(),
            'updated_at' => now(),
        ]);

    // Log the transaction completion
    try {
        $this->logActivity(
            'transaction_completed',
            'Request',
            $id,
            "Transaction completed and received by '{$validated['received_by']}' for request from {$requestData->requester_name} ({$requestData->division_name})"
        );
    } catch (\Exception $e) {
        \Log::error('Failed to create transaction completion activity log: ' . $e->getMessage());
    }

    // Log division activity for transaction completion
    try {
        DivisionLog::logDivisionActivity(
            $requestData->division_id,
            Auth::id(),
            'transaction_completed',
            'Request',
            $id,
            sprintf(
                "Transaction completed and received by '%s' for request from %s (%s)",
                $validated['received_by'],
                $requestData->requester_name,
                $requestData->division_name
            ),
            ['is_done' => null, 'received_by' => null],
            ['is_done' => now(), 'received_by' => $validated['received_by']],
            request()->ip(),
            request()->userAgent()
        );
    } catch (\Exception $e) {
        \Log::error('Failed to log division activity for transaction completion: ' . $e->getMessage());
    }

    return response()->json([
        'status' => 'success',
        'message' => 'Request marked as received successfully',
    ]);
}  
}
