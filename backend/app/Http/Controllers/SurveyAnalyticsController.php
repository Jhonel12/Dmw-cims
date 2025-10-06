<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SurveyAnalyticsController extends Controller
{
    /**
     * Get survey analytics data
     */
    public function getAnalytics(): JsonResponse
    {
        try {
            // Get total responses count
            $totalResponses = DB::table('customer_feedback')
                ->whereNotNull('sqd0') // Only responses with satisfaction rating
                ->count();

            if ($totalResponses === 0) {
                return response()->json([
                    'totalResponses' => 0,
                    'averageSatisfaction' => 0,
                    'maleCount' => 0,
                    'femaleCount' => 0,
                    'walkInCount' => 0,
                    'onlineCount' => 0,
                    'satisfactionBreakdown' => [
                        'excellent' => 0,
                        'good' => 0,
                        'fair' => 0,
                        'poor' => 0,
                        'veryPoor' => 0
                    ],
                    'genderBreakdown' => [
                        'male' => 0,
                        'female' => 0
                    ],
                    'channelBreakdown' => [
                        'walk_in' => 0,
                        'online' => 0
                    ]
                ]);
            }

            // Get average satisfaction rating (sqd0 is stored as string)
            $averageSatisfaction = DB::table('customer_feedback')
                ->whereNotNull('sqd0')
                ->where('sqd0', '!=', '')
                ->selectRaw('AVG(CAST(sqd0 AS DECIMAL(2,1))) as avg_satisfaction')
                ->value('avg_satisfaction');

            // Get gender distribution
            $genderStats = DB::table('customer_feedback')
                ->select('sex', DB::raw('COUNT(*) as count'))
                ->whereNotNull('sqd0')
                ->where('sqd0', '!=', '')
                ->whereNotNull('sex')
                ->groupBy('sex')
                ->get()
                ->pluck('count', 'sex')
                ->toArray();

            // Get channel distribution
            $channelStats = DB::table('customer_feedback')
                ->select('client_channel', DB::raw('COUNT(*) as count'))
                ->whereNotNull('sqd0')
                ->where('sqd0', '!=', '')
                ->whereNotNull('client_channel')
                ->groupBy('client_channel')
                ->get()
                ->pluck('count', 'client_channel')
                ->toArray();

            // Get satisfaction breakdown
            $satisfactionBreakdown = DB::table('customer_feedback')
                ->select('sqd0', DB::raw('COUNT(*) as count'))
                ->whereNotNull('sqd0')
                ->where('sqd0', '!=', '')
                ->groupBy('sqd0')
                ->get()
                ->pluck('count', 'sqd0')
                ->toArray();

            // Format satisfaction breakdown (sqd0 values are strings)
            $formattedSatisfaction = [
                'excellent' => $satisfactionBreakdown['5'] ?? 0,
                'good' => $satisfactionBreakdown['4'] ?? 0,
                'fair' => $satisfactionBreakdown['3'] ?? 0,
                'poor' => $satisfactionBreakdown['2'] ?? 0,
                'veryPoor' => $satisfactionBreakdown['1'] ?? 0
            ];

            // Format gender breakdown
            $formattedGender = [
                'male' => $genderStats['Male'] ?? 0,
                'female' => $genderStats['Female'] ?? 0
            ];

            // Format channel breakdown
            $formattedChannel = [
                'walk_in' => $channelStats['walk-in'] ?? 0,
                'online' => $channelStats['online'] ?? 0
            ];

            return response()->json([
                'totalResponses' => $totalResponses,
                'averageSatisfaction' => round($averageSatisfaction, 2),
                'maleCount' => $formattedGender['male'],
                'femaleCount' => $formattedGender['female'],
                'walkInCount' => $formattedChannel['walk_in'],
                'onlineCount' => $formattedChannel['online'],
                'satisfactionBreakdown' => $formattedSatisfaction,
                'genderBreakdown' => $formattedGender,
                'channelBreakdown' => $formattedChannel,
                'lastUpdated' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch analytics data',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed satisfaction analytics by service type
     */
    public function getSatisfactionByService(): JsonResponse
    {
        try {
            $satisfactionByService = DB::table('customer_feedback')
                ->select(
                    'service_availed',
                    DB::raw('AVG(CAST(sqd0 AS DECIMAL(2,1))) as avg_satisfaction'),
                    DB::raw('COUNT(*) as total_responses'),
                    DB::raw('SUM(CASE WHEN sqd0 = "5" THEN 1 ELSE 0 END) as excellent'),
                    DB::raw('SUM(CASE WHEN sqd0 = "4" THEN 1 ELSE 0 END) as good'),
                    DB::raw('SUM(CASE WHEN sqd0 = "3" THEN 1 ELSE 0 END) as fair'),
                    DB::raw('SUM(CASE WHEN sqd0 = "2" THEN 1 ELSE 0 END) as poor'),
                    DB::raw('SUM(CASE WHEN sqd0 = "1" THEN 1 ELSE 0 END) as very_poor')
                )
                ->whereNotNull('sqd0')
                ->where('sqd0', '!=', '')
                ->whereNotNull('service_availed')
                ->groupBy('service_availed')
                ->orderBy('avg_satisfaction', 'desc')
                ->get();

            return response()->json([
                'satisfactionByService' => $satisfactionByService,
                'lastUpdated' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch satisfaction by service data',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get satisfaction trends over time
     */
    public function getSatisfactionTrends(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'period' => 'string|in:day,week,month',
                'days' => 'integer|min:1|max:365'
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }

            $period = $request->get('period', 'month');
            $days = $request->get('days', 30);

            $startDate = now()->subDays($days);

            $trends = DB::table('customer_feedback')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('AVG(CAST(sqd0 AS DECIMAL(2,1))) as avg_satisfaction'),
                    DB::raw('COUNT(*) as total_responses')
                )
                ->whereNotNull('sqd0')
                ->where('sqd0', '!=', '')
                ->where('created_at', '>=', $startDate)
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get();

            return response()->json([
                'satisfactionTrends' => $trends,
                'period' => $period,
                'days' => $days,
                'lastUpdated' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch satisfaction trends',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get regional analytics
     */
    public function getRegionalAnalytics(): JsonResponse
    {
        try {
            $regionalStats = DB::table('customer_feedback')
                ->select(
                    'region',
                    DB::raw('COUNT(*) as total_responses'),
                    DB::raw('AVG(CAST(sqd0 AS DECIMAL(2,1))) as avg_satisfaction'),
                    DB::raw('SUM(CASE WHEN sex = "Male" THEN 1 ELSE 0 END) as male_count'),
                    DB::raw('SUM(CASE WHEN sex = "Female" THEN 1 ELSE 0 END) as female_count'),
                    DB::raw('SUM(CASE WHEN client_channel = "walk-in" THEN 1 ELSE 0 END) as walk_in_count'),
                    DB::raw('SUM(CASE WHEN client_channel = "online" THEN 1 ELSE 0 END) as online_count')
                )
                ->whereNotNull('sqd0')
                ->where('sqd0', '!=', '')
                ->whereNotNull('region')
                ->groupBy('region')
                ->orderBy('total_responses', 'desc')
                ->get();

            return response()->json([
                'regionalAnalytics' => $regionalStats,
                'lastUpdated' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch regional analytics',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export analytics data as CSV
     */
    public function exportAnalytics(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'string|in:summary,detailed,regional',
                'format' => 'string|in:csv,json'
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }

            $type = $request->get('type', 'summary');
            $format = $request->get('format', 'csv');

            // Generate export data based on type
            switch ($type) {
                case 'detailed':
                    $data = $this->getDetailedExportData();
                    break;
                case 'regional':
                    $data = $this->getRegionalExportData();
                    break;
                default:
                    $data = $this->getSummaryExportData();
                    break;
            }

            if ($format === 'json') {
                return response()->json([
                    'data' => $data,
                    'exported_at' => now()->toISOString(),
                    'type' => $type
                ]);
            }

            // For CSV, we'll return the data structure that can be converted to CSV
            return response()->json([
                'csv_data' => $data,
                'filename' => "survey_analytics_{$type}_" . now()->format('Y-m-d_H-i-s') . ".csv",
                'exported_at' => now()->toISOString(),
                'type' => $type
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to export analytics data',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get summary export data
     */
    private function getSummaryExportData(): array
    {
        $analytics = $this->getAnalytics()->getData(true);
        
        return [
            'total_responses' => $analytics['totalResponses'],
            'average_satisfaction' => $analytics['averageSatisfaction'],
            'male_count' => $analytics['maleCount'],
            'female_count' => $analytics['femaleCount'],
            'walk_in_count' => $analytics['walkInCount'],
            'online_count' => $analytics['onlineCount'],
            'excellent_rating' => $analytics['satisfactionBreakdown']['excellent'],
            'good_rating' => $analytics['satisfactionBreakdown']['good'],
            'fair_rating' => $analytics['satisfactionBreakdown']['fair'],
            'poor_rating' => $analytics['satisfactionBreakdown']['poor'],
            'very_poor_rating' => $analytics['satisfactionBreakdown']['veryPoor'],
            'exported_at' => now()->toISOString()
        ];
    }

    /**
     * Get detailed export data
     */
    private function getDetailedExportData(): array
    {
        return DB::table('customer_feedback')
            ->select(
                'id',
                'control_no',
                'client_type',
                'client_channel',
                'sex',
                'age',
                'region',
                'service_availed',
                'sqd0 as satisfaction_rating',
                'cc1',
                'cc2',
                'cc3',
                'created_at',
                'updated_at'
            )
            ->whereNotNull('sqd0')
            ->where('sqd0', '!=', '')
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get regional export data
     */
    private function getRegionalExportData(): array
    {
        return DB::table('customer_feedback')
            ->select(
                'region',
                DB::raw('COUNT(*) as total_responses'),
                DB::raw('AVG(CAST(sqd0 AS DECIMAL(2,1))) as avg_satisfaction'),
                DB::raw('SUM(CASE WHEN sex = "Male" THEN 1 ELSE 0 END) as male_count'),
                DB::raw('SUM(CASE WHEN sex = "Female" THEN 1 ELSE 0 END) as female_count'),
                DB::raw('SUM(CASE WHEN client_channel = "walk-in" THEN 1 ELSE 0 END) as walk_in_count'),
                DB::raw('SUM(CASE WHEN client_channel = "online" THEN 1 ELSE 0 END) as online_count')
            )
            ->whereNotNull('sqd0')
            ->where('sqd0', '!=', '')
            ->whereNotNull('region')
            ->groupBy('region')
            ->orderBy('total_responses', 'desc')
            ->get()
            ->toArray();
    }
}
