<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DivisionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $divisions = DB::table('divisions')
            ->leftJoin('users', function($join) {
                $join->on('divisions.id', '=', 'users.division_id')
                     ->where('users.user_role', '=', 'division_chief')
                     ->where('users.is_active', '=', true);
            })
            ->where('divisions.is_active', true)
            ->select(
                'divisions.*',
                'users.name as chief_division'
            )
            ->orderBy('divisions.name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'data' => $divisions
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'head_of_division' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'established_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $divisionId = DB::table('divisions')->insertGetId([
            'name' => $request->name,
            'description' => $request->description,
            'head_of_division' => $request->head_of_division,
            'location' => $request->location,
            'established_date' => $request->established_date,
            'notes' => $request->notes,
            'is_active' => $request->has('is_active') ? $request->is_active : true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $division = DB::table('divisions')->find($divisionId);

        return response()->json([
            'status' => 'success',
            'message' => 'Division created successfully',
            'data' => $division
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $division = DB::table('divisions')->find($id);

        if (!$division) {
            return response()->json([
                'status' => 'error',
                'message' => 'Division not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $division
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $division = DB::table('divisions')->find($id);

        if (!$division) {
            return response()->json([
                'status' => 'error',
                'message' => 'Division not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'head_of_division' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'established_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::table('divisions')
            ->where('id', $id)
            ->update([
                'name' => $request->name,
                'description' => $request->description,
                'head_of_division' => $request->head_of_division,
                'location' => $request->location,
                'established_date' => $request->established_date,
                'notes' => $request->notes,
                'is_active' => $request->has('is_active') ? $request->is_active : true,
                'updated_at' => now(),
            ]);

        $updatedDivision = DB::table('divisions')->find($id);

        return response()->json([
            'status' => 'success',
            'message' => 'Division updated successfully',
            'data' => $updatedDivision
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $division = DB::table('divisions')->find($id);

        if (!$division) {
            return response()->json([
                'status' => 'error',
                'message' => 'Division not found'
            ], 404);
        }

        // Check if division has supplies
        $suppliesCount = DB::table('supplies')
            ->where('division_id', $id)
            ->count();

        if ($suppliesCount > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete division. It has associated supplies.'
            ], 422);
        }

        DB::table('divisions')->where('id', $id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Division deleted successfully'
        ]);
    }

    /**
     * Get all divisions for dropdown.
     */
    public function getForDropdown()
    {
        $divisions = DB::table('divisions')
            ->where('is_active', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $divisions
        ]);
    }

    /**
     * Get active divisions only.
     */
    public function getActiveDivisions()
    {
        $divisions = DB::table('divisions')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $divisions
        ]);
    }

    /**
     * Get all divisions (including inactive).
     */
    public function listAll()
    {
        $divisions = DB::table('divisions')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $divisions
        ]);
    }

    /**
     * Search divisions.
     */
    public function search(Request $request)
    {
        $query = $request->get('query', '');
        $status = $request->get('status', 'all');

        $divisions = DB::table('divisions')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('head_of_division', 'like', "%{$query}%")
                  ->orWhere('location', 'like', "%{$query}%");
            });

        if ($status !== 'all') {
            $divisions->where('is_active', $status === 'active');
        }

        $results = $divisions->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $results
        ]);
    }

    /**
     * Get division with supplies count.
     */
    public function getWithSuppliesCount()
    {
        $divisions = DB::table('divisions')
            ->leftJoin('supplies', 'divisions.id', '=', 'supplies.division_id')
            ->select(
                'divisions.*',
                DB::raw('COUNT(supplies.id) as supplies_count')
            )
            ->groupBy('divisions.id')
            ->orderBy('divisions.name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $divisions
        ]);
    }

    /**
     * Bulk action for divisions.
     */
    public function bulkAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:activate,deactivate,delete',
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:divisions,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $action = $request->action;
        $ids = $request->ids;

        switch ($action) {
            case 'activate':
                DB::table('divisions')
                    ->whereIn('id', $ids)
                    ->update(['is_active' => true, 'updated_at' => now()]);
                $message = 'Divisions activated successfully';
                break;

            case 'deactivate':
                DB::table('divisions')
                    ->whereIn('id', $ids)
                    ->update(['is_active' => false, 'updated_at' => now()]);
                $message = 'Divisions deactivated successfully';
                break;

            case 'delete':
                // Check if any division has supplies
                $divisionsWithSupplies = DB::table('supplies')
                    ->whereIn('division_id', $ids)
                    ->distinct()
                    ->pluck('division_id');

                if ($divisionsWithSupplies->count() > 0) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Some divisions have associated supplies and cannot be deleted.'
                    ], 422);
                }

                DB::table('divisions')->whereIn('id', $ids)->delete();
                $message = 'Divisions deleted successfully';
                break;
        }

        return response()->json([
            'status' => 'success',
            'message' => $message
        ]);
    }

    /**
     * Get division statistics.
     */
    public function getStatistics()
    {
        $stats = DB::table('divisions')
            ->select(
                DB::raw('COUNT(*) as total_divisions'),
                DB::raw('COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_divisions'),
                DB::raw('COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_divisions')
            )
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }

    /**
     * Get supplies for a specific division.
     */
    public function getSupplies(string $id)
    {
        // First check if division exists
        $division = DB::table('divisions')->where('id', $id)->first();
        
        if (!$division) {
            return response()->json([
                'status' => 'error',
                'message' => 'Division not found'
            ], 404);
        }

        // Get chief_division from users table if exists
        $chief = DB::table('users')
            ->where('division_id', $id)
            ->where('user_role', 'chief_division')
            ->select('name as chief_division')
            ->first();

        // Add chief_division to division object
        $division->chief_division = $chief ? $chief->chief_division : null;

        // Get supplies from completed requests for this division
        $supplies = DB::table('requests')
            ->join('item_request', 'requests.id', '=', 'item_request.request_id')
            ->join('items', 'item_request.item_id', '=', 'items.id')
            ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
            ->join('users', 'requests.user_id', '=', 'users.id')
            ->where('users.division_id', $id)
            ->where('requests.status', 'admin_approved')
            ->whereNotNull('requests.is_done') // Only completed requests
            ->select(
                'item_request.id',
                'item_request.item_id',
                'item_request.quantity',
                'item_request.remarks',
                'item_request.created_at',
                'item_request.updated_at',
                'items.item_no',
                'items.item_name',
                'items.description',
                'items.quantity_on_hand as total_quantity',
                'items.supplier',
                'items.location',
                'categories.name as category_name',
                'categories.id as category_id',
                'requests.is_done as received_date'
            )
            ->orderBy('items.item_name')
            ->get();

        // Group by item and sum quantities to get total supplies per item
        $groupedSupplies = $supplies->groupBy('item_id')->map(function ($itemSupplies) {
            $firstItem = $itemSupplies->first();
            $totalQuantity = $itemSupplies->sum('quantity');
            
            return [
                'id' => $firstItem->id,
                'item_id' => $firstItem->item_id,
                'item_no' => $firstItem->item_no,
                'item_name' => $firstItem->item_name,
                'description' => $firstItem->description,
                'quantity_on_hand' => $totalQuantity,
                'unit' => 'pieces', // Default unit
                'location' => $firstItem->location,
                'reorder_level' => 0, // Not available in requests
                'reorder_quantity' => 0, // Not available in requests
                'supplier' => $firstItem->supplier,
                'category_name' => $firstItem->category_name,
                'category_id' => $firstItem->category_id,
                'created_at' => $firstItem->created_at,
                'updated_at' => $firstItem->updated_at,
                'received_date' => $firstItem->received_date,
            ];
        })->values();

        $transformedSupplies = $groupedSupplies->toArray();

        return response()->json([
            'status' => 'success',
            'data' => [
                'supplies' => $transformedSupplies,
                'division' => $division
            ]
        ]);
    }
} 