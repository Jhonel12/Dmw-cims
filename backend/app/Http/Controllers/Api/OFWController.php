<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OFW;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OFWController extends Controller
{
    /**
     * Display a listing of OFW records.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = OFW::query();

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nameOfWorker', 'like', "%{$search}%")
                      ->orWhere('position', 'like', "%{$search}%")
                      ->orWhere('countryDestination', 'like', "%{$search}%")
                      ->orWhere('employer', 'like', "%{$search}%")
                      ->orWhere('oecNumber', 'like', "%{$search}%");
                });
            }

            // Filter by sex
            if ($request->has('sex') && $request->sex) {
                $query->where('sex', $request->sex);
            }

            // Filter by country destination
            if ($request->has('country') && $request->country) {
                $query->where('countryDestination', $request->country);
            }

            // Sort functionality
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $ofwRecords = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'OFW records retrieved successfully',
                'data' => $ofwRecords
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching OFW records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created OFW record.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'nameOfWorker' => 'required|string|max:255',
                'sex' => 'required|in:Male,Female',
                'position' => 'required|string|max:255',
                'countryDestination' => 'required|string|max:255',
                'address' => 'required|string',
                'employer' => 'required|string|max:255',
                'oecNumber' => 'required|string|max:255|unique:ofw_records,oecNumber',
                'departureDate' => 'required|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create the new record
            $ofwRecord = OFW::create([
                'nameOfWorker' => $request->nameOfWorker,
                'sex' => $request->sex,
                'position' => $request->position,
                'countryDestination' => $request->countryDestination,
                'address' => $request->address,
                'employer' => $request->employer,
                'oecNumber' => $request->oecNumber,
                'departureDate' => $request->departureDate,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'OFW record created successfully',
                'data' => $ofwRecord
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating OFW record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified OFW record.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $ofwRecord = OFW::find($id);

            if (!$ofwRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'OFW record not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'OFW record retrieved successfully',
                'data' => $ofwRecord
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching OFW record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified OFW record.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            // Check if record exists
            $ofwRecord = OFW::find($id);
            if (!$ofwRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'OFW record not found'
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'nameOfWorker' => 'sometimes|required|string|max:255',
                'sex' => 'sometimes|required|in:Male,Female',
                'position' => 'sometimes|required|string|max:255',
                'countryDestination' => 'sometimes|required|string|max:255',
                'address' => 'sometimes|required|string',
                'employer' => 'sometimes|required|string|max:255',
                'oecNumber' => 'sometimes|required|string|max:255|unique:ofw_records,oecNumber,' . $id,
                'departureDate' => 'sometimes|required|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update the record
            $ofwRecord->update($request->only([
                'nameOfWorker',
                'sex',
                'position',
                'countryDestination',
                'address',
                'employer',
                'oecNumber',
                'departureDate'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'OFW record updated successfully',
                'data' => $ofwRecord->fresh()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating OFW record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified OFW record.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            // Check if record exists
            $ofwRecord = OFW::find($id);
            if (!$ofwRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'OFW record not found'
                ], 404);
            }

            // Soft delete the record
            $ofwRecord->delete();

            return response()->json([
                'success' => true,
                'message' => 'OFW record deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting OFW record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for OFW records.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        try {
            $stats = [
                'total_records' => DB::table('ofw_records')->count(),
                'by_gender' => DB::table('ofw_records')
                    ->select('sex', DB::raw('count(*) as count'))
                    ->groupBy('sex')
                    ->get(),
                'by_country' => DB::table('ofw_records')
                    ->select('countryDestination', DB::raw('count(*) as count'))
                    ->groupBy('countryDestination')
                    ->orderBy('count', 'desc')
                    ->get(),
                'recent_departures' => DB::table('ofw_records')
                    ->where('departureDate', '>=', now()->subDays(30))
                    ->count(),
                'upcoming_departures' => DB::table('ofw_records')
                    ->where('departureDate', '>=', now())
                    ->where('departureDate', '<=', now()->addDays(30))
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Statistics retrieved successfully',
                'data' => $stats
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search OFW records by OEC number.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchByOEC(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'oecNumber' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            $ofwRecord = OFW::where('oecNumber', $request->oecNumber)->first();

            if (!$ofwRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'No OFW record found with the provided OEC number'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'OFW record found',
                'data' => $ofwRecord
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while searching OFW record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get filtered reports data
     */
    public function getReports(Request $request)
    {
        try {
            \Log::info('Reports API called with filters:', $request->all());
            
            // Test database connection
            $recordCount = DB::table('ofw_records')->count();
            \Log::info('Total records in database:', ['count' => $recordCount]);
            
            $query = DB::table('ofw_records');

            // Apply filters
            if ($request->filled('date_from')) {
                \Log::info('Applying date_from filter:', ['date_from' => $request->date_from]);
                // Use whereRaw to avoid timezone issues
                $query->whereRaw('DATE(departureDate) >= ?', [$request->date_from]);
            }

            if ($request->filled('date_to')) {
                \Log::info('Applying date_to filter:', ['date_to' => $request->date_to]);
                // Use whereRaw to avoid timezone issues
                $query->whereRaw('DATE(departureDate) <= ?', [$request->date_to]);
            }

            if ($request->filled('country')) {
                $query->where('countryDestination', $request->country);
            }

            if ($request->filled('sex')) {
                $query->where('sex', $request->sex);
            }

            if ($request->filled('position')) {
                $query->where('position', $request->position);
            }

            // Get filtered data
            \Log::info('Final SQL query:', ['sql' => $query->toSql(), 'bindings' => $query->getBindings()]);
            $records = $query->get();
            \Log::info('Filtered records count:', ['count' => $records->count()]);
            \Log::info('Sample records with departure dates:', $records->take(3)->map(function($record) {
                return [
                    'id' => $record->id,
                    'nameOfWorker' => $record->nameOfWorker,
                    'departureDate' => $record->departureDate
                ];
            })->toArray());

            // Calculate statistics
            $totalRecords = $records->count();
            $totalDepartures = $records->where('departureDate', '<=', now())->count();

            // Countries distribution
            $countries = $records->groupBy('countryDestination')
                ->map(function ($group) {
                    return $group->count();
                })
                ->toArray();

            // Positions distribution
            $positions = $records->groupBy('position')
                ->map(function ($group) {
                    return $group->count();
                })
                ->toArray();

            // Gender distribution
            $genderDistribution = [
                'male' => $records->where('sex', 'Male')->count(),
                'female' => $records->where('sex', 'Female')->count()
            ];

            // Monthly data (last 12 months)
            $monthlyData = [];
            for ($i = 11; $i >= 0; $i--) {
                $month = now()->subMonths($i)->format('Y-m');
                $monthlyData[$month] = $records->filter(function ($record) use ($month) {
                    return str_starts_with($record->departureDate, $month);
                })->count();
            }

            // Recent departures (last 10)
            $recentDepartures = $records->sortByDesc('departureDate')
                ->take(10)
                ->values()
                ->toArray();

            $responseData = [
                'totalRecords' => $totalRecords,
                'totalDepartures' => $totalDepartures,
                'countries' => $countries,
                'positions' => $positions,
                'genderDistribution' => $genderDistribution,
                'monthlyData' => $monthlyData,
                'recentDepartures' => $recentDepartures
            ];
            
            \Log::info('Reports API response data:', $responseData);
            
            return response()->json([
                'success' => true,
                'data' => $responseData
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while generating reports',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export OFW records to Excel
     */
    public function exportExcel(Request $request)
    {
        try {
            $query = DB::table('ofw_records');

            // Apply same filters as reports
            if ($request->filled('date_from')) {
                $query->whereRaw('DATE(departureDate) >= ?', [$request->date_from]);
            }

            if ($request->filled('date_to')) {
                $query->whereRaw('DATE(departureDate) <= ?', [$request->date_to]);
            }

            if ($request->filled('country')) {
                $query->where('countryDestination', $request->country);
            }

            if ($request->filled('sex')) {
                $query->where('sex', $request->sex);
            }

            if ($request->filled('position')) {
                $query->where('position', $request->position);
            }

            $records = $query->get();

            // For now, return JSON data (you can implement actual Excel export later)
            return response()->json([
                'success' => true,
                'message' => 'Export data prepared',
                'data' => $records,
                'count' => $records->count()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while exporting data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export OFW records to PDF
     */
    public function exportPdf(Request $request)
    {
        try {
            $query = DB::table('ofw_records');

            // Apply same filters as reports
            if ($request->filled('date_from')) {
                $query->whereRaw('DATE(departureDate) >= ?', [$request->date_from]);
            }

            if ($request->filled('date_to')) {
                $query->whereRaw('DATE(departureDate) <= ?', [$request->date_to]);
            }

            if ($request->filled('country')) {
                $query->where('countryDestination', $request->country);
            }

            if ($request->filled('sex')) {
                $query->where('sex', $request->sex);
            }

            if ($request->filled('position')) {
                $query->where('position', $request->position);
            }

            $records = $query->get();

            // For now, return JSON data (you can implement actual PDF export later)
            return response()->json([
                'success' => true,
                'message' => 'PDF export data prepared',
                'data' => $records,
                'count' => $records->count()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while exporting PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore a soft deleted OFW record.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function restore($id)
    {
        try {
            // Find the soft deleted record
            $ofwRecord = OFW::withTrashed()->find($id);
            
            if (!$ofwRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'OFW record not found'
                ], 404);
            }

            if (!$ofwRecord->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'OFW record is not deleted'
                ], 400);
            }

            // Restore the record
            $ofwRecord->restore();

            return response()->json([
                'success' => true,
                'message' => 'OFW record restored successfully',
                'data' => $ofwRecord->fresh()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while restoring OFW record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete an OFW record.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function forceDelete($id)
    {
        try {
            // Find the record (including soft deleted ones)
            $ofwRecord = OFW::withTrashed()->find($id);
            
            if (!$ofwRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'OFW record not found'
                ], 404);
            }

            // Permanently delete the record
            $ofwRecord->forceDelete();

            return response()->json([
                'success' => true,
                'message' => 'OFW record permanently deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while permanently deleting OFW record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all soft deleted OFW records.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function trashed()
    {
        try {
            $trashedRecords = OFW::onlyTrashed()->paginate(15);

            return response()->json([
                'success' => true,
                'message' => 'Soft deleted OFW records retrieved successfully',
                'data' => $trashedRecords
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching soft deleted OFW records',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
