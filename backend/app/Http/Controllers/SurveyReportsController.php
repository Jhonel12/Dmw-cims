<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\CustomerFeedback;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SurveyReportsController extends Controller
{
    /**
     * Get all survey reports with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get filter parameters
            $filters = [
                'period' => $request->get('period', 'month'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'satisfaction_level' => $request->get('satisfaction_level'),
                'sex' => $request->get('sex'),
                'client_channel' => $request->get('client_channel'),
                'client_type' => $request->get('client_type')
            ];

            // Generate reports based on filters
            $reports = $this->generateFilteredReports($filters);
            
            return response()->json([
                'success' => true,
                'data' => $reports,
                'message' => 'Reports retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve reports',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a new survey report
     */
    public function generateReport(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month');
            $reportData = $this->generateReportData($period);
            
            // Save report metadata (you might want to save this to a reports table)
            $reportId = $this->saveReportMetadata($reportData);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'report_id' => $reportId,
                    'title' => $reportData['title'],
                    'period' => $reportData['period'],
                    'total_responses' => $reportData['total_responses'],
                    'average_satisfaction' => $reportData['average_satisfaction'],
                    'generated_at' => now()->toISOString(),
                    'status' => 'completed'
                ],
                'message' => 'Report generated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a specific report
     */
    public function downloadReport(Request $request, $reportId): JsonResponse
    {
        try {
            $format = $request->get('format', 'pdf');
            $period = $request->get('period', 'month');
            
            $reportData = $this->generateReportData($period);
            $filename = $this->generateFilename($reportData['title'], $format);
            
            if ($format === 'csv') {
                $csvData = $this->generateCSV($reportData);
                return response()->json([
                    'success' => true,
                    'data' => [
                        'filename' => $filename,
                        'csv_data' => $csvData,
                        'download_url' => null
                    ],
                    'message' => 'CSV report ready for download'
                ]);
            } else {
                // For PDF generation, you might want to use a library like DomPDF
                return response()->json([
                    'success' => true,
                    'data' => [
                        'filename' => $filename,
                        'download_url' => '/api/survey-reports/download/' . $reportId . '/' . $filename
                    ],
                    'message' => 'PDF report ready for download'
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate download',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export survey reports to CSV
     */
    public function exportToCsv(Request $request): JsonResponse
    {
        try {
            // Get filter parameters
            $filters = [
                'period' => $request->get('period', 'month'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'satisfaction_level' => $request->get('satisfaction_level'),
                'sex' => $request->get('sex'),
                'client_channel' => $request->get('client_channel'),
                'client_type' => $request->get('client_type')
            ];

            // Get filtered data
            $table = 'customer_feedback';
            $query = DB::table($table)->whereNotNull('sqd0')->where('sqd0', '!=', '');
            
            // Apply filters - prioritize date range over period
            if (!empty($filters['date_from']) || !empty($filters['date_to'])) {
                if (!empty($filters['date_from'])) {
                    $query->where('date', '>=', $filters['date_from']);
                }
                if (!empty($filters['date_to'])) {
                    $query->where('date', '<=', $filters['date_to']);
                }
            } else {
                $dateRange = $this->getDateRange($filters['period']);
                $query->whereBetween('date', $dateRange);
            }
            if (!empty($filters['satisfaction_level'])) {
                $query->where('sqd0', $filters['satisfaction_level']);
            }
            if (!empty($filters['sex'])) {
                $query->where('sex', $filters['sex']);
            }
            if (!empty($filters['client_channel'])) {
                $query->where('client_channel', $filters['client_channel']);
            }
            if (!empty($filters['client_type'])) {
                $query->where('client_type', $filters['client_type']);
            }

            $surveyData = $query->get();
            $csvData = $this->generateSurveyCSV($surveyData, $filters);
            
            $filename = $this->generateExportFilename('survey-report', 'csv', $filters);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => $filename,
                    'csv_data' => $csvData,
                    'total_records' => $surveyData->count()
                ],
                'message' => 'CSV export ready for download'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export CSV',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export survey reports to PDF
     */
    public function exportToPdf(Request $request): JsonResponse
    {
        try {
            // Get filter parameters
            $filters = [
                'period' => $request->get('period', 'month'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'satisfaction_level' => $request->get('satisfaction_level'),
                'sex' => $request->get('sex'),
                'client_channel' => $request->get('client_channel'),
                'client_type' => $request->get('client_type')
            ];

            // Get filtered data
            $table = 'customer_feedback';
            $query = DB::table($table)->whereNotNull('sqd0')->where('sqd0', '!=', '');
            
            // Apply filters - prioritize date range over period
            if (!empty($filters['date_from']) || !empty($filters['date_to'])) {
                if (!empty($filters['date_from'])) {
                    $query->where('date', '>=', $filters['date_from']);
                }
                if (!empty($filters['date_to'])) {
                    $query->where('date', '<=', $filters['date_to']);
                }
            } else {
                $dateRange = $this->getDateRange($filters['period']);
                $query->whereBetween('date', $dateRange);
            }
            if (!empty($filters['satisfaction_level'])) {
                $query->where('sqd0', $filters['satisfaction_level']);
            }
            if (!empty($filters['sex'])) {
                $query->where('sex', $filters['sex']);
            }
            if (!empty($filters['client_channel'])) {
                $query->where('client_channel', $filters['client_channel']);
            }
            if (!empty($filters['client_type'])) {
                $query->where('client_type', $filters['client_type']);
            }

            $surveyData = $query->get();
            
            $filename = $this->generateExportFilename('survey-report', 'pdf', $filters);
            
            return response()->json([
                'success' => true,
                'data' => $surveyData->toArray(),
                'message' => 'PDF export ready for download'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get report statistics using Query Builder (matching analytics controller schema)
     */
    public function getStatistics(): JsonResponse
    {
        try {
            // Get total responses count using Query Builder (matching analytics controller)
            $totalResponses = DB::table('customer_feedback')
                ->whereNotNull('sqd0') // Only responses with satisfaction rating
                ->where('sqd0', '!=', '') // Exclude empty strings
                ->count();
            
            $stats = [
                'total_reports' => $this->getTotalReportsCount(),
                'total_responses' => $totalResponses,
                'overall_satisfaction' => $this->getOverallSatisfaction(),
                'completed_reports' => $this->getCompletedReportsCount(),
                'reports_by_period' => $this->getReportsByPeriodStats(),
                'recent_reports' => $this->getRecentReports(5)
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate filtered reports based on user criteria
     */
    private function generateFilteredReports(array $filters): array
    {
        $table = 'customer_feedback';
        
        // Debug: Log received filters
        \Log::info('SurveyReports Filters:', $filters);
        
        // Build base query
        $query = DB::table($table)->whereNotNull('sqd0')->where('sqd0', '!=', '');
        
        // Apply date filters - prioritize date range over period
        if (!empty($filters['date_from']) || !empty($filters['date_to'])) {
            if (!empty($filters['date_from'])) {
                // Filter by the 'date' field, not 'created_at'
                $query->where('date', '>=', $filters['date_from']);
                \Log::info('Applied date_from filter:', ['date_from' => $filters['date_from'], 'field' => 'date']);
            }
            if (!empty($filters['date_to'])) {
                // Filter by the 'date' field, not 'created_at'
                $query->where('date', '<=', $filters['date_to']);
                \Log::info('Applied date_to filter:', ['date_to' => $filters['date_to'], 'field' => 'date']);
            }
        } else {
            // If no date filters, use period
            $dateRange = $this->getDateRange($filters['period']);
            $query->whereBetween('date', $dateRange);
            \Log::info('Applied period filter:', ['period' => $filters['period'], 'dateRange' => $dateRange, 'field' => 'date']);
        }
        
        // Apply other filters
        if (!empty($filters['satisfaction_level'])) {
            $query->where('sqd0', $filters['satisfaction_level']);
            \Log::info('Applied satisfaction_level filter:', ['satisfaction_level' => $filters['satisfaction_level']]);
        }
        if (!empty($filters['sex'])) {
            $query->where('sex', $filters['sex']);
            \Log::info('Applied sex filter:', ['sex' => $filters['sex']]);
        }
        if (!empty($filters['client_channel'])) {
            $query->where('client_channel', $filters['client_channel']);
            \Log::info('Applied client_channel filter:', ['client_channel' => $filters['client_channel']]);
        }
        if (!empty($filters['client_type'])) {
            $query->where('client_type', $filters['client_type']);
            \Log::info('Applied client_type filter:', ['client_type' => $filters['client_type']]);
        }
        
        // Debug: Log the SQL query
        \Log::info('Generated SQL Query:', ['sql' => $query->toSql(), 'bindings' => $query->getBindings()]);
        
        // Get filtered data
        $filteredData = $query->get();
        
        // Debug: Log result count
        \Log::info('Filtered data count:', ['count' => $filteredData->count()]);
        
        // Calculate statistics from filtered data
        $totalResponses = $filteredData->count();
        $averageSatisfaction = $totalResponses > 0 ? 
            round($filteredData->avg(function($item) { return (float)$item->sqd0; }), 2) : 0;
        
        // Calculate breakdowns
        $satisfactionBreakdown = [
            'excellent' => $filteredData->where('sqd0', '5')->count(),
            'good' => $filteredData->where('sqd0', '4')->count(),
            'fair' => $filteredData->where('sqd0', '3')->count(),
            'poor' => $filteredData->where('sqd0', '2')->count(),
            'very_poor' => $filteredData->where('sqd0', '1')->count(),
        ];
        
        $genderBreakdown = [
            'male' => $filteredData->where('sex', 'Male')->count(),
            'female' => $filteredData->where('sex', 'Female')->count(),
        ];
        
        $channelBreakdown = [
            'walk_in' => $filteredData->where('client_channel', 'walk-in')->count(),
            'online' => $filteredData->where('client_channel', 'online')->count(),
        ];
        
        // Generate report title based on filters
        $title = $this->generateReportTitleFromFilters($filters);
        $period = $this->generatePeriodLabelFromFilters($filters);
        
        // Return report data in the same format as the original reports
        if ($totalResponses > 0) {
            return [
                [
                    'id' => 1,
                    'title' => $title,
                    'period' => $period,
                    'total_responses' => $totalResponses,
                    'average_satisfaction' => $averageSatisfaction,
                    'generated_at' => now()->toISOString(),
                    'status' => 'completed',
                    'filters_applied' => $filters,
                    'breakdowns' => [
                        'satisfaction' => $satisfactionBreakdown,
                        'gender' => $genderBreakdown,
                        'channel' => $channelBreakdown
                    ]
                ]
            ];
        }
        
        return [];
    }

    /**
     * Get reports by period
     */
    private function getReportsByPeriod(string $period): array
    {
        $reports = [];
        
        switch ($period) {
            case 'week':
                $reports = $this->getWeeklyReports();
                break;
            case 'month':
                $reports = $this->getMonthlyReports();
                break;
            case 'quarter':
                $reports = $this->getQuarterlyReports();
                break;
            case 'year':
                $reports = $this->getYearlyReports();
                break;
            default:
                $reports = $this->getMonthlyReports();
        }

        return $reports;
    }

    /**
     * Generate report data for a specific period
     */
    private function generateReportData(string $period): array
    {
        $dateRange = $this->getDateRange($period);
        $table = 'customer_feedback';
        
        // Get total responses and average satisfaction in one query (matching analytics controller schema)
        // Note: sqd0 is stored as string, so we convert to numeric for AVG calculation
        $basicStats = DB::table($table)
            ->whereBetween('created_at', $dateRange)
            ->whereNotNull('sqd0') // Only responses with satisfaction rating
            ->where('sqd0', '!=', '') // Exclude empty strings
            ->selectRaw('
                COUNT(*) as total_responses,
                AVG(CAST(sqd0 AS DECIMAL(2,1))) as average_satisfaction
            ')
            ->first();
        
        $totalResponses = $basicStats->total_responses ?? 0;
        $averageSatisfaction = round($basicStats->average_satisfaction ?? 0, 2);

        if ($totalResponses === 0) {
            return [
                'title' => $this->getReportTitle($period),
                'period' => $this->getPeriodLabel($period),
                'total_responses' => 0,
                'average_satisfaction' => 0,
                'satisfaction_breakdown' => [
                    'excellent' => 0,
                    'good' => 0,
                    'fair' => 0,
                    'poor' => 0,
                    'very_poor' => 0,
                ],
                'gender_breakdown' => [
                    'male' => 0,
                    'female' => 0,
                ],
                'channel_breakdown' => [
                    'walk_in' => 0,
                    'online' => 0,
                ],
                'date_range' => $dateRange,
                'generated_at' => now()->toISOString(),
            ];
        }

        // Get satisfaction breakdown using query builder (matching analytics controller)
        // Note: sqd0 is stored as string in database, so we compare with string values
        $satisfactionBreakdown = DB::table($table)
            ->whereBetween('created_at', $dateRange)
            ->whereNotNull('sqd0')
            ->where('sqd0', '!=', '')
            ->selectRaw('
                SUM(CASE WHEN sqd0 = "5" THEN 1 ELSE 0 END) as excellent,
                SUM(CASE WHEN sqd0 = "4" THEN 1 ELSE 0 END) as good,
                SUM(CASE WHEN sqd0 = "3" THEN 1 ELSE 0 END) as fair,
                SUM(CASE WHEN sqd0 = "2" THEN 1 ELSE 0 END) as poor,
                SUM(CASE WHEN sqd0 = "1" THEN 1 ELSE 0 END) as very_poor
            ')
            ->first();

        // Get gender breakdown using query builder (matching analytics controller schema)
        $genderBreakdown = DB::table($table)
            ->whereBetween('created_at', $dateRange)
            ->whereNotNull('sqd0')
            ->whereNotNull('sex')
            ->selectRaw('
                SUM(CASE WHEN sex = "Male" THEN 1 ELSE 0 END) as male,
                SUM(CASE WHEN sex = "Female" THEN 1 ELSE 0 END) as female
            ')
            ->first();

        // Get channel breakdown using query builder (matching analytics controller schema)
        $channelBreakdown = DB::table($table)
            ->whereBetween('created_at', $dateRange)
            ->whereNotNull('sqd0')
            ->whereNotNull('client_channel')
            ->selectRaw('
                SUM(CASE WHEN client_channel = "walk-in" THEN 1 ELSE 0 END) as walk_in,
                SUM(CASE WHEN client_channel = "online" THEN 1 ELSE 0 END) as online
            ')
            ->first();

        return [
            'title' => $this->getReportTitle($period),
            'period' => $this->getPeriodLabel($period),
            'total_responses' => $totalResponses,
            'average_satisfaction' => $averageSatisfaction,
            'satisfaction_breakdown' => [
                'excellent' => $satisfactionBreakdown->excellent ?? 0,
                'good' => $satisfactionBreakdown->good ?? 0,
                'fair' => $satisfactionBreakdown->fair ?? 0,
                'poor' => $satisfactionBreakdown->poor ?? 0,
                'very_poor' => $satisfactionBreakdown->very_poor ?? 0,
            ],
            'gender_breakdown' => [
                'male' => $genderBreakdown->male ?? 0,
                'female' => $genderBreakdown->female ?? 0,
            ],
            'channel_breakdown' => [
                'walk_in' => $channelBreakdown->walk_in ?? 0,
                'online' => $channelBreakdown->online ?? 0,
            ],
            'date_range' => $dateRange,
            'generated_at' => now()->toISOString(),
        ];
    }

    /**
     * Get date range based on period
     */
    private function getDateRange(string $period): array
    {
        $now = Carbon::now();
        
        switch ($period) {
            case 'week':
                return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()];
            case 'month':
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
            case 'quarter':
                return [$now->copy()->startOfQuarter(), $now->copy()->endOfQuarter()];
            case 'year':
                return [$now->copy()->startOfYear(), $now->copy()->endOfYear()];
            case 'all':
                // Return a very wide date range to include all data
                return [Carbon::parse('2020-01-01'), $now->copy()->endOfDay()];
            case 'last_week':
                return [$now->copy()->subWeek()->startOfWeek(), $now->copy()->subWeek()->endOfWeek()];
            case 'last_month':
                return [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()];
            case 'last_quarter':
                return [$now->copy()->subQuarter()->startOfQuarter(), $now->copy()->subQuarter()->endOfQuarter()];
            case 'last_year':
                return [$now->copy()->subYear()->startOfYear(), $now->copy()->subYear()->endOfYear()];
            default:
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
        }
    }

    /**
     * Generate CSV data for survey export
     */
    private function generateSurveyCSV($surveyData, array $filters): string
    {
        $csv = "SURVEY REPORT\n";
        $csv .= "Generated: " . now()->format('Y-m-d H:i:s') . "\n";
        $csv .= "Total Responses: " . $surveyData->count() . "\n";
        
        // Add filter information
        if (!empty($filters['period'])) {
            $csv .= "Period: " . $this->getPeriodLabel($filters['period']) . "\n";
        }
        if (!empty($filters['date_from'])) {
            $csv .= "Date From: " . $filters['date_from'] . "\n";
        }
        if (!empty($filters['date_to'])) {
            $csv .= "Date To: " . $filters['date_to'] . "\n";
        }
        if (!empty($filters['satisfaction_level'])) {
            $csv .= "Satisfaction Level: " . $filters['satisfaction_level'] . "\n";
        }
        if (!empty($filters['sex'])) {
            $csv .= "Gender: " . $filters['sex'] . "\n";
        }
        if (!empty($filters['client_channel'])) {
            $csv .= "Channel: " . $filters['client_channel'] . "\n";
        }
        if (!empty($filters['client_type'])) {
            $csv .= "Client Type: " . $filters['client_type'] . "\n";
        }
        
        $csv .= "\n";
        
        // Add summary statistics
        $totalResponses = $surveyData->count();
        $averageSatisfaction = $totalResponses > 0 ? round($surveyData->avg(function($item) { return (float)$item->sqd0; }), 2) : 0;
        
        $csv .= "SUMMARY STATISTICS\n";
        $csv .= "Total Responses,{$totalResponses}\n";
        $csv .= "Average Satisfaction,{$averageSatisfaction}\n\n";
        
        // Add breakdowns
        $satisfactionBreakdown = [
            'excellent' => $surveyData->where('sqd0', '5')->count(),
            'good' => $surveyData->where('sqd0', '4')->count(),
            'fair' => $surveyData->where('sqd0', '3')->count(),
            'poor' => $surveyData->where('sqd0', '2')->count(),
            'very_poor' => $surveyData->where('sqd0', '1')->count(),
        ];
        
        $csv .= "SATISFACTION BREAKDOWN\n";
        $csv .= "Excellent (5),{$satisfactionBreakdown['excellent']}\n";
        $csv .= "Good (4),{$satisfactionBreakdown['good']}\n";
        $csv .= "Fair (3),{$satisfactionBreakdown['fair']}\n";
        $csv .= "Poor (2),{$satisfactionBreakdown['poor']}\n";
        $csv .= "Very Poor (1),{$satisfactionBreakdown['very_poor']}\n\n";
        
        $genderBreakdown = [
            'male' => $surveyData->where('sex', 'Male')->count(),
            'female' => $surveyData->where('sex', 'Female')->count(),
        ];
        
        $csv .= "GENDER BREAKDOWN\n";
        $csv .= "Male,{$genderBreakdown['male']}\n";
        $csv .= "Female,{$genderBreakdown['female']}\n\n";
        
        $channelBreakdown = [
            'walk_in' => $surveyData->where('client_channel', 'walk-in')->count(),
            'online' => $surveyData->where('client_channel', 'online')->count(),
        ];
        
        $csv .= "CHANNEL BREAKDOWN\n";
        $csv .= "Walk-in,{$channelBreakdown['walk_in']}\n";
        $csv .= "Online,{$channelBreakdown['online']}\n\n";
        
        // Add detailed data
        $csv .= "DETAILED RESPONSES\n";
        $csv .= "ID,Control Number,Client Type,Client Channel,Gender,Satisfaction Rating,Comments,Created Date\n";
        
        foreach ($surveyData as $response) {
            $csv .= "\"{$response->id}\",";
            $csv .= "\"{$response->control_no}\",";
            $csv .= "\"{$response->client_type}\",";
            $csv .= "\"{$response->client_channel}\",";
            $csv .= "\"{$response->sex}\",";
            $csv .= "\"{$response->sqd0}\",";
            $csv .= "\"" . str_replace('"', '""', $response->comments ?? '') . "\",";
            $csv .= "\"" . date('Y-m-d H:i:s', strtotime($response->created_at)) . "\"\n";
        }

        return $csv;
    }

    /**
     * Generate PDF data for survey export (simplified version)
     */
    private function generateSurveyPDF($surveyData, array $filters): string
    {
        // For now, return a simple text representation
        // In a real implementation, you would use a PDF library like DomPDF or TCPDF
        $pdf = "SURVEY REPORT\n";
        $pdf .= "Generated: " . now()->format('Y-m-d H:i:s') . "\n";
        $pdf .= "Total Responses: " . $surveyData->count() . "\n\n";
        
        $pdf .= "Filters Applied:\n";
        foreach ($filters as $key => $value) {
            if (!empty($value)) {
                $pdf .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": " . $value . "\n";
            }
        }
        
        $pdf .= "\nDetailed data would be formatted as a PDF table here.\n";
        $pdf .= "This is a placeholder for PDF generation functionality.\n";
        
        return $pdf;
    }

    /**
     * Generate export filename
     */
    private function generateExportFilename(string $type, string $format, array $filters): string
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $filterSuffix = '';
        
        if (!empty($filters['period'])) {
            $filterSuffix .= '_' . $filters['period'];
        }
        if (!empty($filters['sex'])) {
            $filterSuffix .= '_' . strtolower($filters['sex']);
        }
        if (!empty($filters['client_channel'])) {
            $filterSuffix .= '_' . str_replace('-', '', $filters['client_channel']);
        }
        
        return "{$type}{$filterSuffix}_{$timestamp}.{$format}";
    }

    /**
     * Generate CSV data
     */
    private function generateCSV(array $reportData): string
    {
        $csv = "Survey Report - {$reportData['title']}\n";
        $csv .= "Period: {$reportData['period']}\n";
        $csv .= "Generated: {$reportData['generated_at']}\n\n";
        
        $csv .= "Metric,Value\n";
        $csv .= "Total Responses,{$reportData['total_responses']}\n";
        $csv .= "Average Satisfaction,{$reportData['average_satisfaction']}\n\n";
        
        $csv .= "Satisfaction Breakdown\n";
        $csv .= "Excellent,{$reportData['satisfaction_breakdown']['excellent']}\n";
        $csv .= "Good,{$reportData['satisfaction_breakdown']['good']}\n";
        $csv .= "Fair,{$reportData['satisfaction_breakdown']['fair']}\n";
        $csv .= "Poor,{$reportData['satisfaction_breakdown']['poor']}\n";
        $csv .= "Very Poor,{$reportData['satisfaction_breakdown']['very_poor']}\n\n";
        
        $csv .= "Gender Breakdown\n";
        $csv .= "Male,{$reportData['gender_breakdown']['male']}\n";
        $csv .= "Female,{$reportData['gender_breakdown']['female']}\n\n";
        
        $csv .= "Channel Breakdown\n";
        $csv .= "Walk-in,{$reportData['channel_breakdown']['walk_in']}\n";
        $csv .= "Online,{$reportData['channel_breakdown']['online']}\n";

        return $csv;
    }

    /**
     * Generate filename for report
     */
    private function generateFilename(string $title, string $format): string
    {
        $sanitizedTitle = preg_replace('/[^a-zA-Z0-9\s]/', '', $title);
        $sanitizedTitle = str_replace(' ', '_', $sanitizedTitle);
        $timestamp = now()->format('Y-m-d_H-i-s');
        
        return "{$sanitizedTitle}_{$timestamp}.{$format}";
    }

    /**
     * Save report metadata (mock implementation)
     */
    private function saveReportMetadata(array $reportData): string
    {
        // In a real implementation, you would save this to a reports table
        return uniqid('report_');
    }

    /**
     * Generate report title based on applied filters
     */
    private function generateReportTitleFromFilters(array $filters): string
    {
        $titleParts = ['Survey Report'];
        
        if (!empty($filters['satisfaction_level'])) {
            $levelMap = ['1' => 'Very Poor', '2' => 'Poor', '3' => 'Fair', '4' => 'Good', '5' => 'Excellent'];
            $titleParts[] = $levelMap[$filters['satisfaction_level']] . ' Satisfaction';
        }
        
        if (!empty($filters['sex'])) {
            $titleParts[] = $filters['sex'] . ' Responses';
        }
        
        if (!empty($filters['client_channel'])) {
            $channelMap = ['walk-in' => 'Walk-in', 'online' => 'Online'];
            $titleParts[] = $channelMap[$filters['client_channel']] . ' Clients';
        }
        
        if (!empty($filters['client_type'])) {
            $titleParts[] = $filters['client_type'] . ' Clients';
        }
        
        return implode(' - ', $titleParts);
    }

    /**
     * Generate period label based on applied filters
     */
    private function generatePeriodLabelFromFilters(array $filters): string
    {
        if (!empty($filters['date_from']) && !empty($filters['date_to'])) {
            $from = Carbon::parse($filters['date_from'])->format('M j');
            $to = Carbon::parse($filters['date_to'])->format('M j, Y');
            return "{$from} - {$to}";
        }
        
        if (!empty($filters['date_from'])) {
            return 'From ' . Carbon::parse($filters['date_from'])->format('M j, Y');
        }
        
        if (!empty($filters['date_to'])) {
            return 'Until ' . Carbon::parse($filters['date_to'])->format('M j, Y');
        }
        
        // Fall back to period-based label
        return $this->getPeriodLabel($filters['period'] ?? 'month');
    }

    /**
     * Get report title based on period
     */
    private function getReportTitle(string $period): string
    {
        $now = Carbon::now();
        
        switch ($period) {
            case 'week':
                return 'Weekly Survey Summary';
            case 'month':
                return 'Monthly Survey Summary';
            case 'quarter':
                return 'Quarterly Analytics Report';
            case 'year':
                return 'Annual Survey Report';
            case 'all':
                return 'Complete Survey Report';
            case 'last_week':
                return 'Previous Week Survey Summary';
            case 'last_month':
                return 'Previous Month Survey Summary';
            case 'last_quarter':
                return 'Previous Quarter Analytics Report';
            case 'last_year':
                return 'Previous Year Survey Report';
            default:
                return 'Survey Report';
        }
    }

    /**
     * Get period label
     */
    private function getPeriodLabel(string $period): string
    {
        $now = Carbon::now();
        
        switch ($period) {
            case 'week':
                return "Week of {$now->format('M j, Y')}";
            case 'month':
                return $now->format('F Y');
            case 'quarter':
                return "Q{$now->quarter} {$now->year}";
            case 'year':
                return $now->year;
            case 'all':
                return "All Time (2020 - {$now->year})";
            case 'last_week':
                return "Week of {$now->copy()->subWeek()->format('M j, Y')}";
            case 'last_month':
                return $now->copy()->subMonth()->format('F Y');
            case 'last_quarter':
                $lastQuarter = $now->copy()->subQuarter();
                return "Q{$lastQuarter->quarter} {$lastQuarter->year}";
            case 'last_year':
                return ($now->year - 1);
            default:
                return $now->format('F Y');
        }
    }

    /**
     * Get real reports for different periods based on actual data
     */
    private function getWeeklyReports(): array
    {
        $dateRange = $this->getDateRange('week');
        $reportData = $this->generateReportData('week');
        
        return [
            [
                'id' => 1,
                'title' => 'Weekly Survey Summary',
                'period' => 'Week of ' . Carbon::now()->format('M j, Y'),
                'total_responses' => $reportData['total_responses'],
                'average_satisfaction' => $reportData['average_satisfaction'],
                'generated_at' => Carbon::now()->toISOString(),
                'status' => 'completed'
            ]
        ];
    }

    private function getMonthlyReports(): array
    {
        $currentMonthData = $this->generateReportData('month');
        $lastMonthData = $this->generateReportDataForPeriod(
            Carbon::now()->subMonth()->startOfMonth(),
            Carbon::now()->subMonth()->endOfMonth()
        );
        
        $reports = [];
        
        // Current month report
        if ($currentMonthData['total_responses'] > 0) {
            $reports[] = [
                'id' => 1,
                'title' => 'Monthly Survey Summary',
                'period' => Carbon::now()->format('F Y'),
                'total_responses' => $currentMonthData['total_responses'],
                'average_satisfaction' => $currentMonthData['average_satisfaction'],
                'generated_at' => Carbon::now()->toISOString(),
                'status' => 'completed'
            ];
        }
        
        // Last month report
        if ($lastMonthData['total_responses'] > 0) {
            $reports[] = [
                'id' => 2,
                'title' => 'Monthly Survey Summary',
                'period' => Carbon::now()->subMonth()->format('F Y'),
                'total_responses' => $lastMonthData['total_responses'],
                'average_satisfaction' => $lastMonthData['average_satisfaction'],
                'generated_at' => Carbon::now()->subMonth()->toISOString(),
                'status' => 'completed'
            ];
        }
        
        return $reports;
    }

    private function getQuarterlyReports(): array
    {
        $reportData = $this->generateReportData('quarter');
        
        if ($reportData['total_responses'] > 0) {
            return [
                [
                    'id' => 1,
                    'title' => 'Quarterly Analytics Report',
                    'period' => 'Q' . Carbon::now()->quarter . ' ' . Carbon::now()->year,
                    'total_responses' => $reportData['total_responses'],
                    'average_satisfaction' => $reportData['average_satisfaction'],
                    'generated_at' => Carbon::now()->toISOString(),
                    'status' => 'completed'
                ]
            ];
        }
        
        return [];
    }

    private function getYearlyReports(): array
    {
        $reportData = $this->generateReportData('year');
        
        if ($reportData['total_responses'] > 0) {
            return [
                [
                    'id' => 1,
                    'title' => 'Annual Survey Report',
                    'period' => Carbon::now()->year,
                    'total_responses' => $reportData['total_responses'],
                    'average_satisfaction' => $reportData['average_satisfaction'],
                    'generated_at' => Carbon::now()->toISOString(),
                    'status' => 'completed'
                ]
            ];
        }
        
        return [];
    }

    /**
     * Generate report data for a specific date range
     */
    private function generateReportDataForPeriod($startDate, $endDate): array
    {
        $table = 'customer_feedback';
        
        // Get total responses and average satisfaction for the specific date range
        $basicStats = DB::table($table)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('sqd0')
            ->where('sqd0', '!=', '')
            ->selectRaw('
                COUNT(*) as total_responses,
                AVG(CAST(sqd0 AS DECIMAL(2,1))) as average_satisfaction
            ')
            ->first();
        
        $totalResponses = $basicStats->total_responses ?? 0;
        $averageSatisfaction = round($basicStats->average_satisfaction ?? 0, 2);

        return [
            'total_responses' => $totalResponses,
            'average_satisfaction' => $averageSatisfaction,
        ];
    }

    /**
     * Get statistics methods using Query Builder (matching analytics controller schema)
     */
    private function getTotalReportsCount(): int
    {
        // Mock implementation - in real app, count from reports table
        return 12;
    }

    private function getOverallSatisfaction(): float
    {
        $avg = DB::table('customer_feedback')
            ->whereNotNull('sqd0') // Only responses with satisfaction rating
            ->where('sqd0', '!=', '') // Exclude empty strings
            ->selectRaw('AVG(CAST(sqd0 AS DECIMAL(2,1))) as avg_satisfaction')
            ->value('avg_satisfaction');
        
        return round($avg ?? 0, 2); // Match analytics controller precision
    }

    private function getCompletedReportsCount(): int
    {
        // Mock implementation
        return 10;
    }

    private function getReportsByPeriodStats(): array
    {
        $now = Carbon::now();
        
        // Get counts for different periods using Query Builder (matching analytics controller)
        $weekly = DB::table('customer_feedback')
            ->whereBetween('created_at', [
                $now->copy()->startOfWeek(),
                $now->copy()->endOfWeek()
            ])
            ->whereNotNull('sqd0')
            ->where('sqd0', '!=', '')
            ->count();
            
        $monthly = DB::table('customer_feedback')
            ->whereBetween('created_at', [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth()
            ])
            ->whereNotNull('sqd0')
            ->where('sqd0', '!=', '')
            ->count();
            
        $quarterly = DB::table('customer_feedback')
            ->whereBetween('created_at', [
                $now->copy()->startOfQuarter(),
                $now->copy()->endOfQuarter()
            ])
            ->whereNotNull('sqd0')
            ->where('sqd0', '!=', '')
            ->count();
            
        $yearly = DB::table('customer_feedback')
            ->whereBetween('created_at', [
                $now->copy()->startOfYear(),
                $now->copy()->endOfYear()
            ])
            ->whereNotNull('sqd0')
            ->where('sqd0', '!=', '')
            ->count();
        
        return [
            'weekly' => $weekly,
            'monthly' => $monthly,
            'quarterly' => $quarterly,
            'yearly' => $yearly
        ];
    }

    private function getRecentReports(int $limit): array
    {
        // Mock implementation - return recent reports
        return [
            [
                'id' => 1,
                'title' => 'Monthly Survey Summary',
                'period' => Carbon::now()->format('F Y'),
                'generated_at' => Carbon::now()->subDays(1)->toISOString(),
                'status' => 'completed'
            ],
            [
                'id' => 2,
                'title' => 'Weekly Survey Summary',
                'period' => 'Week of ' . Carbon::now()->subWeek()->format('M j, Y'),
                'generated_at' => Carbon::now()->subDays(3)->toISOString(),
                'status' => 'completed'
            ]
        ];
    }
}
