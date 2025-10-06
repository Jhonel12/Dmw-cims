<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ClientSuggestionsController extends Controller
{
    /**
     * Get all client suggestions with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '');

            // Apply filters
            if ($request->has('client_type') && !empty($request->client_type)) {
                $query->where('client_type', $request->client_type);
            }

            if ($request->has('sex') && !empty($request->sex)) {
                $query->where('sex', $request->sex);
            }

            if ($request->has('client_channel') && !empty($request->client_channel)) {
                $query->where('client_channel', $request->client_channel);
            }

            if ($request->has('service_availed') && !empty($request->service_availed)) {
                $query->where('service_availed', $request->service_availed);
            }

            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->where('date', '>=', $request->date_from);
            }

            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->where('date', '<=', $request->date_to);
            }

            // Apply search
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('suggestions', 'like', "%{$searchTerm}%")
                      ->orWhere('control_no', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%");
                });
            }

            // Get suggestions with pagination
            $perPage = $request->get('per_page', 20);
            $suggestions = $query->orderBy('date', 'desc')
                ->paginate($perPage);

            // Format the data
            $formattedSuggestions = $suggestions->map(function ($suggestion) {
                return [
                    'id' => $suggestion->id,
                    'control_no' => $suggestion->control_no ?? 'N/A',
                    'client_type' => $suggestion->client_type ?? 'N/A',
                    'sex' => $suggestion->sex ?? 'N/A',
                    'age' => $suggestion->age,
                    'region' => $suggestion->region,
                    'service_availed' => $suggestion->service_availed ?? 'N/A',
                    'suggestions' => $suggestion->suggestions ?? '',
                    'email' => $suggestion->email,
                    'date' => $suggestion->date,
                    'created_at' => $suggestion->created_at,
                    'updated_at' => $suggestion->updated_at,
                    'client_channel' => $suggestion->client_channel ?? 'N/A'
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedSuggestions,
                'pagination' => [
                    'current_page' => $suggestions->currentPage(),
                    'last_page' => $suggestions->lastPage(),
                    'per_page' => $suggestions->perPage(),
                    'total' => $suggestions->total(),
                    'from' => $suggestions->firstItem(),
                    'to' => $suggestions->lastItem()
                ],
                'message' => 'Client suggestions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching client suggestions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client suggestions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific client suggestion by ID
     */
    public function show($id): JsonResponse
    {
        try {
            $suggestion = DB::table('customer_feedback')
                ->where('id', $id)
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '')
                ->first();

            if (!$suggestion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client suggestion not found'
                ], 404);
            }

            $formattedSuggestion = [
                'id' => $suggestion->id,
                'control_no' => $suggestion->control_no ?? 'N/A',
                'client_type' => $suggestion->client_type ?? 'N/A',
                'sex' => $suggestion->sex ?? 'N/A',
                'age' => $suggestion->age,
                'region' => $suggestion->region,
                'service_availed' => $suggestion->service_availed ?? 'N/A',
                'suggestions' => $suggestion->suggestions ?? '',
                'email' => $suggestion->email,
                'date' => $suggestion->date,
                'created_at' => $suggestion->created_at,
                'updated_at' => $suggestion->updated_at,
                'client_channel' => $suggestion->client_channel ?? 'N/A'
            ];

            return response()->json([
                'success' => true,
                'data' => $formattedSuggestion,
                'message' => 'Client suggestion retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching client suggestion: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client suggestion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for client suggestions
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $totalSuggestions = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '')
                ->count();

            $onlineSuggestions = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '')
                ->where('client_channel', 'online')
                ->count();

            $walkinSuggestions = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '')
                ->where('client_channel', 'walk-in')
                ->count();

            $thisMonthSuggestions = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '')
                ->whereMonth('date', Carbon::now()->month)
                ->whereYear('date', Carbon::now()->year)
                ->count();

            // Get suggestions by client type
            $suggestionsByClientType = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '')
                ->select('client_type', DB::raw('count(*) as count'))
                ->groupBy('client_type')
                ->get()
                ->pluck('count', 'client_type');

            // Get suggestions by service
            $suggestionsByService = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '')
                ->select('service_availed', DB::raw('count(*) as count'))
                ->groupBy('service_availed')
                ->get()
                ->pluck('count', 'service_availed');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_suggestions' => $totalSuggestions,
                    'online_suggestions' => $onlineSuggestions,
                    'walkin_suggestions' => $walkinSuggestions,
                    'this_month_suggestions' => $thisMonthSuggestions,
                    'suggestions_by_client_type' => $suggestionsByClientType,
                    'suggestions_by_service' => $suggestionsByService
                ],
                'message' => 'Statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching client suggestions statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export client suggestions to CSV
     */
    public function exportToCsv(Request $request): JsonResponse
    {
        try {
            $query = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '');

            // Apply the same filters as index method
            if ($request->has('client_type') && !empty($request->client_type)) {
                $query->where('client_type', $request->client_type);
            }

            if ($request->has('sex') && !empty($request->sex)) {
                $query->where('sex', $request->sex);
            }

            if ($request->has('client_channel') && !empty($request->client_channel)) {
                $query->where('client_channel', $request->client_channel);
            }

            if ($request->has('service_availed') && !empty($request->service_availed)) {
                $query->where('service_availed', $request->service_availed);
            }

            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->where('date', '>=', $request->date_from);
            }

            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->where('date', '<=', $request->date_to);
            }

            $suggestions = $query->orderBy('date', 'desc')->get();

            $csvData = $this->generateSuggestionsCSV($suggestions, $request->all());

            $filename = $this->generateExportFilename('client-suggestions', 'csv', $request->all());

            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => $filename,
                    'csv_data' => $csvData,
                    'total_records' => $suggestions->count()
                ],
                'message' => 'CSV export ready for download'
            ]);

        } catch (\Exception $e) {
            Log::error('Error exporting client suggestions to CSV: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export CSV',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export client suggestions to PDF
     */
    public function exportToPdf(Request $request): JsonResponse
    {
        try {
            $query = DB::table('customer_feedback')
                ->whereNotNull('suggestions')
                ->where('suggestions', '!=', '');

            // Apply the same filters as index method
            if ($request->has('client_type') && !empty($request->client_type)) {
                $query->where('client_type', $request->client_type);
            }

            if ($request->has('sex') && !empty($request->sex)) {
                $query->where('sex', $request->sex);
            }

            if ($request->has('client_channel') && !empty($request->client_channel)) {
                $query->where('client_channel', $request->client_channel);
            }

            if ($request->has('service_availed') && !empty($request->service_availed)) {
                $query->where('service_availed', $request->service_availed);
            }

            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->where('date', '>=', $request->date_from);
            }

            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->where('date', '<=', $request->date_to);
            }

            $suggestions = $query->orderBy('date', 'desc')->get();

            $filename = $this->generateExportFilename('client-suggestions', 'pdf', $request->all());

            return response()->json([
                'success' => true,
                'data' => $suggestions->toArray(),
                'message' => 'PDF export ready for download'
            ]);

        } catch (\Exception $e) {
            Log::error('Error exporting client suggestions to PDF: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate CSV data for client suggestions
     */
    private function generateSuggestionsCSV($suggestions, array $filters): string
    {
        $csv = "Client Suggestions Report\n";
        $csv .= "Generated: " . now()->format('Y-m-d H:i:s') . "\n";
        $csv .= "Total Records: " . $suggestions->count() . "\n\n";

        // Add filters applied
        if (!empty(array_filter($filters))) {
            $csv .= "Filters Applied:\n";
            foreach ($filters as $key => $value) {
                if (!empty($value)) {
                    $csv .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": " . $value . "\n";
                }
            }
            $csv .= "\n";
        }

        // CSV headers
        $csv .= "Control No,Client Type,Sex,Age,Region,Service Availed,Suggestions,Email,Channel,Date\n";

        // CSV data
        foreach ($suggestions as $suggestion) {
            $csv .= '"' . ($suggestion->control_no ?? 'N/A') . '",';
            $csv .= '"' . ($suggestion->client_type ?? 'N/A') . '",';
            $csv .= '"' . ($suggestion->sex ?? 'N/A') . '",';
            $csv .= '"' . ($suggestion->age ?? 'N/A') . '",';
            $csv .= '"' . ($suggestion->region ?? 'N/A') . '",';
            $csv .= '"' . ($suggestion->service_availed ?? 'N/A') . '",';
            $csv .= '"' . str_replace('"', '""', $suggestion->suggestions ?? '') . '",';
            $csv .= '"' . ($suggestion->email ?? 'N/A') . '",';
            $csv .= '"' . ($suggestion->client_channel ?? 'N/A') . '",';
            $csv .= '"' . ($suggestion->date ?? 'N/A') . '"' . "\n";
        }

        return $csv;
    }

    /**
     * Generate export filename based on filters
     */
    private function generateExportFilename(string $type, string $format, array $filters): string
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $filename = "{$type}_{$timestamp}";

        // Add filter indicators to filename
        if (!empty($filters['client_type'])) {
            $filename .= '_' . str_replace(' ', '_', $filters['client_type']);
        }
        if (!empty($filters['client_channel'])) {
            $filename .= '_' . $filters['client_channel'];
        }

        return $filename . ".{$format}";
    }
}
