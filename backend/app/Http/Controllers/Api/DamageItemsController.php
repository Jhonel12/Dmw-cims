<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller; // ✅ import base controller
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DamageItemsController extends Controller
{
    use LogsActivity;
    /**
     * Display a listing of damage reports
     */
    public function index(Request $request)
    {
        $query = DB::table('damage_items')
            ->join('items', 'damage_items.item_id', '=', 'items.id')
            ->join('users as reported_by', 'damage_items.reported_by_user_id', '=', 'reported_by.id')
            ->leftJoin('users as repaired_by', 'damage_items.repaired_by_user_id', '=', 'repaired_by.id')
            ->select(
                'damage_items.*',
                'items.item_name',
                'items.item_no',
                'reported_by.name as reported_by_name',
                'repaired_by.name as repaired_by_name'
            );

        // Filter by status if provided
        if ($request->filled('status')) {
            $query->where('damage_items.status', $request->status);
        }

        // Filter by damage type if provided
        if ($request->filled('damage_type')) {
            $query->where('damage_items.damage_type', $request->damage_type);
        }

        // Filter by severity if provided
        if ($request->filled('severity')) {
            $query->where('damage_items.severity', $request->severity);
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('items.item_name', 'LIKE', "%{$search}%")
                  ->orWhere('items.item_no', 'LIKE', "%{$search}%")
                  ->orWhere('damage_items.description', 'LIKE', "%{$search}%");
            });
        }

        // Date range filters
        if ($request->filled('date_from')) {
            $query->whereDate('damage_items.damage_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('damage_items.damage_date', '<=', $request->date_to);
        }

        // Get per_page from request, default to 15
        $perPage = $request->get('per_page', 15);
        $damageReports = $query->orderBy('damage_items.created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $damageReports->items(),
            'pagination' => [
                'current_page' => $damageReports->currentPage(),
                'last_page' => $damageReports->lastPage(),
                'per_page' => $damageReports->perPage(),
                'total' => $damageReports->total(),
            ]
        ]);
    }

    /**
     * Store a new damage report
     */
    public function store(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'damage_date' => 'required|date|before_or_equal:today',
            'damage_type' => [
                'required',
                Rule::in([
                    'physical_damage',
                    'water_damage',
                    'expired',
                    'broken_during_handling',
                    'defective_upon_arrival',
                    'storage_damage',
                    'transportation_damage',
                    'other'
                ])
            ],
            'description' => 'required|string|max:1000',
            'severity' => 'required|in:minor,major,total_loss',
            'estimated_repair_cost' => 'nullable|numeric|min:0|max:999999.99',
        ]);

        DB::beginTransaction();

        try {
            // Insert damage report
            $damageReportId = DB::table('damage_items')->insertGetId([
                'item_id' => $request->item_id,
                'reported_by_user_id' => Auth::id(),
                'damage_date' => $request->damage_date,
                'damage_type' => $request->damage_type,
                'description' => $request->description,
                'severity' => $request->severity,
                'damaged_quantity' => $request->damaged_quantity, // ✅ Save damaged qty
                'estimated_repair_cost' => $request->estimated_repair_cost,
                'status' => 'reported',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update item condition to damaged
            DB::table('items')
                ->where('id', $request->item_id)
                ->update([
                    'condition' => 'damaged',
                    'updated_at' => now(),
                ]);

            DB::commit();

            // Get the created damage report with item details
            $damageReport = DB::table('damage_items')
                ->join('items', 'damage_items.item_id', '=', 'items.id')
                ->join('users', 'damage_items.reported_by_user_id', '=', 'users.id')
                ->select(
                    'damage_items.*',
                    'items.item_name',
                    'items.item_no',
                    'users.name as reported_by_name'
                )
                ->where('damage_items.id', $damageReportId)
                ->first();

            return response()->json([
                'status' => 'success',
                'message' => 'Damage report created successfully',
                'data' => $damageReport
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create damage report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified damage report
     */
    public function show($id)
    {
        $damageReport = DB::table('damage_items')
            ->join('items', 'damage_items.item_id', '=', 'items.id')
            ->join('users as reported_by', 'damage_items.reported_by_user_id', '=', 'reported_by.id')
            ->leftJoin('users as repaired_by', 'damage_items.repaired_by_user_id', '=', 'repaired_by.id')
            ->select(
                'damage_items.*',
                'items.item_name',
                'items.item_no',
                'items.condition as item_condition',
                'reported_by.name as reported_by_name',
                'repaired_by.name as repaired_by_name'
            )
            ->where('damage_items.id', $id)
            ->first();

        if (!$damageReport) {
            return response()->json([
                'status' => 'error',
                'message' => 'Damage report not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $damageReport
        ]);
    }

    /**
     * Update the damage report status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:reported,under_repair,repaired,disposed',
            'repair_notes' => 'nullable|string|max:1000',
            'actual_repair_cost' => 'nullable|numeric|min:0|max:999999.99',
        ]);

        DB::beginTransaction();

        try {
            $updateData = [
                'status' => $request->status,
                'updated_at' => now(),
            ];

            // If marking as repaired
            if ($request->status === 'repaired') {
                $updateData['repaired_date'] = now();
                $updateData['repaired_by_user_id'] = Auth::id();
                $updateData['actual_repair_cost'] = $request->actual_repair_cost;
                $updateData['repair_notes'] = $request->repair_notes;
            }

            // Update damage report
            $updated = DB::table('damage_items')
                ->where('id', $id)
                ->update($updateData);

            if (!$updated) {
                throw new \Exception('Damage report not found');
            }

            // Update item condition based on status
            $itemCondition = match ($request->status) {
                'under_repair' => 'under_repair',
                'repaired' => 'good',
                'disposed' => 'disposed',
                default => 'damaged'
            };

            // Get item_id first
            $itemId = DB::table('damage_items')->where('id', $id)->value('item_id');

            DB::table('items')
                ->where('id', $itemId)
                ->update([
                    'condition' => $itemCondition,
                    'updated_at' => now(),
                ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Damage report status updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update damage report status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get damage statistics
     */
    public function statistics()
    {
        $stats = [
            'total_damage_reports' => DB::table('damage_items')->count(),
            'by_status' => DB::table('damage_items')
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
            'by_severity' => DB::table('damage_items')
                ->select('severity', DB::raw('count(*) as count'))
                ->groupBy('severity')
                ->pluck('count', 'severity'),
            'by_damage_type' => DB::table('damage_items')
                ->select('damage_type', DB::raw('count(*) as count'))
                ->groupBy('damage_type')
                ->pluck('count', 'damage_type'),
            'total_estimated_cost' => DB::table('damage_items')
                ->sum('estimated_repair_cost'),
            'total_actual_cost' => DB::table('damage_items')
                ->sum('actual_repair_cost'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }

    /**
     * Get damage reports for a specific item
     */
    public function getByItem($itemId)
    {
        $damageReports = DB::table('damage_items')
            ->join('users as reported_by', 'damage_items.reported_by_user_id', '=', 'reported_by.id')
            ->leftJoin('users as repaired_by', 'damage_items.repaired_by_user_id', '=', 'repaired_by.id')
            ->select(
                'damage_items.*',
                'reported_by.name as reported_by_name',
                'repaired_by.name as repaired_by_name'
            )
            ->where('damage_items.item_id', $itemId)
            ->orderBy('damage_items.created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $damageReports
        ]);
    }

    /**
     * Mark items as damaged and reduce quantity (matches frontend modal)
     */
    public function markDamaged(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'damage_date' => 'required|date|before_or_equal:today',
            'damage_type' => [
                'required',
                Rule::in([
                    'physical_damage',
                    'water_damage',
                    'expired',
                    'broken_during_handling',
                    'defective_upon_arrival',
                    'storage_damage',
                    'transportation_damage',
                    'other'
                ])
            ],
            'description' => 'required|string|max:1000',
            'severity' => 'required|in:minor,major,total_loss',
            'damaged_quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'estimated_repair_cost' => 'nullable|numeric|min:0|max:999999.99',
        ]);

        DB::beginTransaction();

        try {
            // Get current item quantity
            $item = DB::table('items')->where('id', $request->item_id)->first();
            
            if (!$item) {
                throw new \Exception('Item not found');
            }

            // Check if there's enough quantity to damage
            if ($item->quantity_on_hand < $request->damaged_quantity) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Insufficient quantity. Available: ' . $item->quantity_on_hand . ', Requested: ' . $request->damaged_quantity
                ], 400);
            }

            // Calculate new quantity
            $newQuantity = $item->quantity_on_hand - $request->damaged_quantity;

            // Insert damage report
            $damageReportId = DB::table('damage_items')->insertGetId([
                'item_id' => $request->item_id,
                'reported_by_user_id' => Auth::id(),
                'damage_date' => $request->damage_date,
                'damage_type' => $request->damage_type,
                'description' => $request->description,
                'severity' => $request->severity,
                'damaged_quantity' => $request->damaged_quantity, // ✅ Save damaged qty
                'estimated_repair_cost' => $request->estimated_repair_cost,
                'status' => 'reported',
                'repair_notes' => $request->notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update item quantity and condition
            DB::table('items')
                ->where('id', $request->item_id)
                ->update([
                    'quantity_on_hand' => $newQuantity,
                    'updated_at' => now(),
                ]);

            // Log the damage report with detailed information
            try {
                $this->logDamageReport(
                    $request->item_id,
                    $item->item_name,
                    $request->damaged_quantity,
                    $newQuantity,
                    $request->damage_type
                );
            } catch (\Exception $e) {
                // Log the error but don't fail the transaction
                \Log::error('Failed to create damage activity log: ' . $e->getMessage());
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Items marked as damaged successfully',
                'data' => [
                    'success' => true,
                    'newQuantity' => $newQuantity,
                    'damagedQuantity' => $request->damaged_quantity,
                    'damageReportId' => $damageReportId
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark items as damaged',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}