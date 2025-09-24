<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Category;
use App\Models\Division;
use App\Models\User;
use App\Models\Request;
use App\Models\ActivityLog;
use App\Models\DamageItem;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Html;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Style\Font;
use PhpOffice\PhpWord\Style\Table;
use PhpOffice\PhpWord\Style\Paragraph;
use Dompdf\Dompdf;
use Dompdf\Options;

class ReportController extends Controller
{
    /**
     * Generate Inventory Summary Report
     */
    public function generateInventorySummaryReport(HttpRequest $request)
    {
        try {
            $filters = $this->parseFilters($request);
            
            // Debug logging
            \Log::info('Inventory Summary Report Filters:', [
                'raw_request' => $request->all(),
                'parsed_filters' => $filters
            ]);
            
            // Get base query with filters
            $query = $this->buildInventoryQuery($filters);
            
            // Get summary statistics
            $summary = $this->getInventorySummaryStats($query, $filters);
            
            // Get detailed items data
            $items = $this->getInventoryItemsData($query, $filters)->toArray();
            
            \Log::info('Items data after conversion to array:', [
                'items_count' => count($items),
                'first_item' => !empty($items) ? $items[0] : null
            ]);
            
            // Get category breakdown
            $categoryBreakdown = $this->getCategoryBreakdown($filters);
            
            // Get division breakdown (if applicable)
            $divisionBreakdown = $this->getDivisionBreakdown($filters);
            
            // Get stock status breakdown
            $stockStatusBreakdown = $this->getStockStatusBreakdown($filters);
            
            // Get recent activity
            $recentActivity = $this->getRecentInventoryActivity($filters);
            
            $reportData = [
                'report_info' => [
                    'title' => 'Inventory Summary Report',
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'generated_by' => auth()->user()->name ?? 'System',
                    'filters_applied' => $filters,
                    'total_items' => $summary['total_items'],
                ],
                'summary' => $summary,
                'items' => $items,
                'breakdowns' => [
                    'by_category' => $categoryBreakdown,
                    'by_division' => $divisionBreakdown,
                    'by_stock_status' => $stockStatusBreakdown,
                ],
                'recent_activity' => $recentActivity,
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate inventory summary report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate Supply Requests Report
     */
    public function generateSupplyRequestsReport(HttpRequest $request)
    {
        try {
            $filters = $this->parseFilters($request);
            
            // Get requests data
            $requestsQuery = $this->buildRequestsQuery($filters);
            $requests = $requestsQuery->paginate($filters['per_page'] ?? 50);
            
            // Get summary statistics
            $summary = $this->getRequestsSummaryStats($filters);
            
            // Get status breakdown
            $statusBreakdown = $this->getRequestsStatusBreakdown($filters);
            
            // Get division breakdown
            $divisionBreakdown = $this->getRequestsDivisionBreakdown($filters);
            
            $reportData = [
                'report_info' => [
                    'title' => 'Supply Requests Report',
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'generated_by' => auth()->user()->name ?? 'System',
                    'filters_applied' => $filters,
                    'total_requests' => $summary['total_requests'],
                ],
                'summary' => $summary,
                'requests' => $requests,
                'breakdowns' => [
                    'by_status' => $statusBreakdown,
                    'by_division' => $divisionBreakdown,
                ],
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate supply requests report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Comprehensive Summary Request Report
     * This report provides detailed insights into the request system based on RequestController functionality
     */
    public function generateSummaryRequestReport(HttpRequest $request)
    {
        try {
            $filters = $this->parseFilters($request);
            
            // Get comprehensive request data with all related information
            $requestsQuery = $this->buildDetailedRequestsQuery($filters);
            $requests = $requestsQuery->paginate($filters['per_page'] ?? 100);
            
            // Get comprehensive summary statistics
            $summary = $this->getComprehensiveRequestSummary($filters);
            
            // Get detailed breakdowns
            $statusBreakdown = $this->getDetailedStatusBreakdown($filters);
            $divisionBreakdown = $this->getDetailedDivisionBreakdown($filters);
            $workflowBreakdown = $this->getWorkflowBreakdown($filters);
            $urgencyBreakdown = $this->getUrgencyBreakdown($filters);
            $timelineAnalysis = $this->getRequestTimelineAnalysis($filters);
            $performanceMetrics = $this->getRequestPerformanceMetrics($filters);
            $topRequesters = $this->getTopRequesters($filters);
            $itemRequestAnalysis = $this->getItemRequestAnalysis($filters);
            
            $reportData = [
                'report_info' => [
                    'title' => 'Comprehensive Summary Request Report',
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'generated_by' => auth()->user()->name ?? 'System',
                    'filters_applied' => $filters,
                    'total_requests' => $summary['total_requests'],
                    'report_period' => $this->getReportPeriod($filters),
                ],
                'summary' => $summary,
                'requests' => $requests,
                'breakdowns' => [
                    'by_status' => $statusBreakdown,
                    'by_division' => $divisionBreakdown,
                    'by_workflow' => $workflowBreakdown,
                    'by_urgency' => $urgencyBreakdown,
                ],
                'analysis' => [
                    'timeline' => $timelineAnalysis,
                    'performance' => $performanceMetrics,
                    'top_requesters' => $topRequesters,
                    'item_requests' => $itemRequestAnalysis,
                ],
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate summary request report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate Division Activity Report
     */
    public function generateDivisionActivityReport(HttpRequest $request)
    {
        try {
            $filters = $this->parseFilters($request);
            
            // Get activity logs
            $activityQuery = $this->buildActivityQuery($filters);
            $activities = $activityQuery->paginate($filters['per_page'] ?? 50);
            
            // Get summary statistics
            $summary = $this->getActivitySummaryStats($filters);
            
            // Get activity breakdown by type
            $activityTypeBreakdown = $this->getActivityTypeBreakdown($filters);
            
            // Get user activity breakdown
            $userActivityBreakdown = $this->getUserActivityBreakdown($filters);
            
            $reportData = [
                'report_info' => [
                    'title' => 'Division Activity Report',
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'generated_by' => auth()->user()->name ?? 'System',
                    'filters_applied' => $filters,
                    'total_activities' => $summary['total_activities'],
                ],
                'summary' => $summary,
                'activities' => $activities,
                'breakdowns' => [
                    'by_type' => $activityTypeBreakdown,
                    'by_user' => $userActivityBreakdown,
                ],
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate division activity report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate Damaged Items Report
     */
    public function generateDamagedItemsReport(HttpRequest $request)
    {
        try {
            $filters = $this->parseFilters($request);
            
            // Get damaged items data
            $damagedQuery = $this->buildDamagedItemsQuery($filters);
            $damagedItems = $damagedQuery->paginate($filters['per_page'] ?? 50);
            
            // Get summary statistics
            $summary = $this->getDamagedItemsSummaryStats($filters);
            
            // Get damage reason breakdown
            $reasonBreakdown = $this->getDamageReasonBreakdown($filters);
            
            $reportData = [
                'report_info' => [
                    'title' => 'Damaged Items Report',
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'generated_by' => auth()->user()->name ?? 'System',
                    'filters_applied' => $filters,
                    'total_damaged_items' => $summary['total_damaged_items'],
                ],
                'summary' => $summary,
                'damaged_items' => $damagedItems,
                'breakdowns' => [
                    'by_reason' => $reasonBreakdown,
                ],
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate damaged items report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate User Activity Report
     */
    public function generateUserActivityReport(HttpRequest $request)
    {
        try {
            $filters = $this->parseFilters($request);
            
            // Get user activity data
            $userActivityQuery = $this->buildUserActivityQuery($filters);
            $userActivities = $userActivityQuery->paginate($filters['per_page'] ?? 50);
            
            // Get summary statistics
            $summary = $this->getUserActivitySummaryStats($filters);
            
            // Get login activity breakdown
            $loginBreakdown = $this->getLoginActivityBreakdown($filters);
            
            $reportData = [
                'report_info' => [
                    'title' => 'User Activity Report',
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'generated_by' => auth()->user()->name ?? 'System',
                    'filters_applied' => $filters,
                    'total_users' => $summary['total_users'],
                ],
                'summary' => $summary,
                'user_activities' => $userActivities,
                'breakdowns' => [
                    'login_activity' => $loginBreakdown,
                ],
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate user activity report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate Monthly Summary Report
     */
    public function generateMonthlySummaryReport(HttpRequest $request)
    {
        try {
            $filters = $this->parseFilters($request);
            
            // Get comprehensive monthly data
            $monthlyData = $this->getMonthlySummaryData($filters);
            
            $reportData = [
                'report_info' => [
                    'title' => 'Monthly Summary Report',
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'generated_by' => auth()->user()->name ?? 'System',
                    'filters_applied' => $filters,
                    'report_period' => $filters['date_from'] . ' to ' . $filters['date_to'],
                ],
                'monthly_data' => $monthlyData,
            ];
            
            return response()->json([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate monthly summary report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export report to Excel
     */
    public function exportReport(HttpRequest $request)
    {
        try {
            $reportType = $request->input('report_type');
            $format = $request->input('format', 'xlsx');
            $filters = $this->parseFilters($request);
            
            // Generate report data based on type
            $reportData = $this->generateReportData($reportType, $filters);
            
            // Debug logging
            \Log::info('Export Report Data:', [
                'report_type' => $reportType,
                'format' => $format,
                'filters_applied' => $filters,
                'data_structure' => array_keys($reportData),
                'has_summary' => isset($reportData['summary']),
                'has_items' => isset($reportData['items']),
                'items_count' => isset($reportData['items']) ? count($reportData['items']) : 0,
                'summary_data' => $reportData['summary'] ?? null,
                'first_few_items' => isset($reportData['items']) ? array_slice($reportData['items'], 0, 3) : null
            ]);
            
            // Create spreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Add report header
            $this->addReportHeader($sheet, $reportData['report_info'] ?? []);
            
            // Add data based on report type
            $this->addReportData($sheet, $reportType, $reportData);
            
            // Generate filename
            $filename = $this->generateFilename($reportType, $format);
            
            // Set headers for download
            $headers = $this->getExportHeaders($format, $filename);
            
            // Generate file content
            $content = $this->generateFileContent($spreadsheet, $format, $reportData);
            
            return response($content, 200, $headers);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Helper methods
    
    private function mapFrontendStatusToDatabase($frontendStatus)
    {
        $statusMapping = [
            'Damaged' => 'reported',
            'Lost' => 'disposed', // Assuming lost items are marked as disposed
            'Disposed' => 'disposed',
            'Under Repair' => 'under_repair',
            'Good Condition' => 'good_condition',
        ];
        
        return $statusMapping[$frontendStatus] ?? null;
    }
    
    private function parseFilters(HttpRequest $request)
    {
        return [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'division' => $request->input('division'),
            'category' => $request->input('category'),
            'status' => $request->input('status'),
            'item_type' => $request->input('item_type'),
            'is_urgent' => $request->has('is_urgent') ? (bool) $request->input('is_urgent') : null,
            'per_page' => $request->input('per_page', 50),
        ];
    }
    
    private function buildInventoryQuery($filters)
    {
        // Use query builder with joins instead of Eloquent relationships
        $query = DB::table('items')
            ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
            ->leftJoin('damage_items', function($join) {
                $join->on('items.id', '=', 'damage_items.item_id')
                     ->where('damage_items.status', '!=', 'repaired'); // Exclude repaired items from damage status
            })
            ->select([
                'items.id',
                'items.item_no',
                'items.item_name',
                'items.description',
                'items.quantity_on_hand',
                'items.unit',
                'items.reorder_level',
                'items.reorder_quantity',
                'items.supplier',
                'items.location',
                'items.created_at',
                'items.updated_at',
                'categories.name as category_name',
                'damage_items.status as damage_status',
                'damage_items.damage_type',
                'damage_items.severity',
                'damage_items.damage_date'
            ]);
        
        // Debug logging
        \Log::info('Building inventory query with filters:', $filters);
        
        // Apply date filters
        if ($filters['date_from']) {
            $query->where('items.created_at', '>=', $filters['date_from'] . ' 00:00:00');
            \Log::info('Applied date_from filter:', ['date_from' => $filters['date_from']]);
        }
        if ($filters['date_to']) {
            $query->where('items.created_at', '<=', $filters['date_to'] . ' 23:59:59');
            \Log::info('Applied date_to filter:', ['date_to' => $filters['date_to']]);
        }
        
        // Division filter not applicable - items table doesn't have division_id
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            \Log::info('Division filter ignored - items table has no division relationship:', ['division' => $filters['division']]);
        }
        
        // Apply category filter
        if ($filters['category'] && $filters['category'] !== 'All Categories') {
            // Get the category and all its children
            $categoryIds = $this->getCategoryAndChildrenIds($filters['category']);
            $query->whereIn('items.category_id', $categoryIds);
            \Log::info('Applied category filter:', ['category' => $filters['category'], 'category_ids' => $categoryIds]);
        }
        
        // Apply damage status filter
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $damageStatus = $this->mapFrontendStatusToDatabase($filters['status']);
            if ($damageStatus) {
                if ($damageStatus === 'good_condition') {
                    // Items with no damage records or repaired damage
                    $query->where(function($q) {
                        $q->whereNull('damage_items.id')
                          ->orWhere('damage_items.status', 'repaired');
                    });
                } else {
                    $query->where('damage_items.status', $damageStatus);
                }
                \Log::info('Applied damage status filter:', ['status' => $filters['status'], 'mapped_status' => $damageStatus]);
            }
        }
        
        // Apply item type filter
        if ($filters['item_type'] && $filters['item_type'] !== 'All Types') {
            // This would need to be implemented based on your item type logic
            \Log::info('Item type filter not implemented yet:', ['item_type' => $filters['item_type']]);
        }
        
        // Log the final query
        \Log::info('Final query SQL:', ['sql' => $query->toSql(), 'bindings' => $query->getBindings()]);
        
        return $query;
    }
    
    private function getInventorySummaryStats($query, $filters)
    {
        // Clone the query for stats calculation
        $baseQuery = clone $query;
        
        // Get basic counts and sums
        $totalItems = $baseQuery->count();
        
        // Value calculation not available - items table doesn't have unit_price column
        $totalValue = 0;
        
        // In stock items
        $inStockQuery = clone $query;
        $inStockItems = $inStockQuery->where('items.quantity_on_hand', '>', 0)->count();
        
        // Low stock items
        $lowStockQuery = clone $query;
        $lowStockItems = $lowStockQuery->where('items.quantity_on_hand', '>', 0)
            ->where('items.reorder_level', '>', 0)
            ->whereColumn('items.quantity_on_hand', '<=', 'items.reorder_level')
            ->count();
        
        // Out of stock items
        $outOfStockQuery = clone $query;
        $outOfStockItems = $outOfStockQuery->where('items.quantity_on_hand', '<=', 0)->count();
        
        // Total quantity
        $quantityQuery = clone $query;
        $totalQuantity = $quantityQuery->sum('items.quantity_on_hand');
        
        // Damage-related statistics
        $damagedQuery = clone $query;
        $damagedItems = $damagedQuery->where('damage_items.status', 'reported')->count();
        
        $underRepairQuery = clone $query;
        $underRepairItems = $underRepairQuery->where('damage_items.status', 'under_repair')->count();
        
        $disposedQuery = clone $query;
        $disposedItems = $disposedQuery->where('damage_items.status', 'disposed')->count();
        
        $goodConditionQuery = clone $query;
        $goodConditionItems = $goodConditionQuery->where(function($q) {
            $q->whereNull('damage_items.id')
              ->orWhere('damage_items.status', 'repaired');
        })->count();
        
        \Log::info('Summary stats calculated:', [
            'total_items' => $totalItems,
            'total_value' => $totalValue,
            'in_stock_items' => $inStockItems,
            'low_stock_items' => $lowStockItems,
            'out_of_stock_items' => $outOfStockItems,
            'total_quantity' => $totalQuantity,
            'damaged_items' => $damagedItems,
            'under_repair_items' => $underRepairItems,
            'disposed_items' => $disposedItems,
            'good_condition_items' => $goodConditionItems
        ]);
        
        return [
            'total_items' => $totalItems,
            'total_value' => $totalValue,
            'in_stock_items' => $inStockItems,
            'low_stock_items' => $lowStockItems,
            'out_of_stock_items' => $outOfStockItems,
            'total_quantity' => $totalQuantity,
            'damaged_items' => $damagedItems,
            'under_repair_items' => $underRepairItems,
            'disposed_items' => $disposedItems,
            'good_condition_items' => $goodConditionItems,
        ];
    }
    
    private function getInventoryItemsData($query, $filters)
    {
        $items = $query->orderBy('items.item_name')->get();
        
        \Log::info('Items data retrieved:', ['count' => $items->count()]);
        
        return $items->map(function($item) {
            return [
                'id' => $item->id,
                'item_no' => $item->item_no,
                'item_name' => $item->item_name,
                'description' => $item->description,
                'category' => $item->category_name ?? 'N/A',
                'quantity_on_hand' => $item->quantity_on_hand,
                'unit' => $item->unit,
                'unit_price' => 0, // Not available in current table structure
                'total_value' => 0, // Not available without unit_price
                'reorder_level' => $item->reorder_level,
                'reorder_quantity' => $item->reorder_quantity,
                'supplier' => $item->supplier,
                'location' => $item->location,
                'stock_status' => $this->getStockStatusFromData($item),
                'damage_status' => $this->getDamageStatusFromData($item),
                'damage_type' => $item->damage_type ?? null,
                'damage_severity' => $item->severity ?? null,
                'damage_date' => $item->damage_date ? \Carbon\Carbon::parse($item->damage_date)->format('Y-m-d H:i:s') : null,
                'created_at' => \Carbon\Carbon::parse($item->created_at)->format('Y-m-d H:i:s'),
                'updated_at' => \Carbon\Carbon::parse($item->updated_at)->format('Y-m-d H:i:s'),
            ];
        });
    }
    
    private function getStockStatus($item)
    {
        if ($item->quantity_on_hand <= 0) {
            return 'Out of Stock';
        } elseif ($item->reorder_level > 0 && $item->quantity_on_hand <= $item->reorder_level) {
            return 'Low Stock';
        } else {
            return 'In Stock';
        }
    }
    
    private function getStockStatusFromData($item)
    {
        if ($item->quantity_on_hand <= 0) {
            return 'Out of Stock';
        } elseif ($item->reorder_level > 0 && $item->quantity_on_hand <= $item->reorder_level) {
            return 'Low Stock';
        } else {
            return 'In Stock';
        }
    }
    
    private function getDamageStatusFromData($item)
    {
        if (!$item->damage_status) {
            return 'Good Condition';
        }
        
        $statusMapping = [
            'reported' => 'Damaged',
            'under_repair' => 'Under Repair',
            'repaired' => 'Good Condition',
            'disposed' => 'Disposed',
        ];
        
        return $statusMapping[$item->damage_status] ?? 'Unknown';
    }
    
    private function getCategoryAndChildrenIds($categoryName)
    {
        // Find the category by name
        $category = Category::where('name', $categoryName)->first();
        
        if (!$category) {
            \Log::warning('Category not found:', ['category_name' => $categoryName]);
            return [];
        }
        
        // Get all child categories recursively
        $categoryIds = [$category->id];
        $this->getChildCategoryIds($category->id, $categoryIds);
        
        \Log::info('Category hierarchy found:', [
            'parent_category' => $categoryName,
            'parent_id' => $category->id,
            'all_category_ids' => $categoryIds
        ]);
        
        return $categoryIds;
    }
    
    private function getChildCategoryIds($parentId, &$categoryIds)
    {
        $children = Category::where('parent_id', $parentId)->get();
        
        foreach ($children as $child) {
            $categoryIds[] = $child->id;
            // Recursively get grandchildren
            $this->getChildCategoryIds($child->id, $categoryIds);
        }
    }
    
    private function buildRequestsQuery($filters)
    {
        $query = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('users as evaluator', 'requests.evaluator_id', '=', 'evaluator.id')
            ->leftJoin('users as admin', 'requests.admin_id', '=', 'admin.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id')
            ->select([
                'requests.id',
                'requests.status',
                'requests.admin_status',
                'requests.is_urgent',
                'requests.created_at',
                'requests.updated_at',
                'requester.name as requester_name',
                'requester.email as requester_email',
                'evaluator.name as evaluator_name',
                'admin.name as admin_name',
                'divisions.name as division_name'
            ]);
        
        // Apply date filters
        if ($filters['date_from']) {
            $query->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $query->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        
        // Apply division filter
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $query->where('divisions.name', $filters['division']);
        }
        
        // Apply status filter
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $query->where('requests.status', $filters['status']);
        }
        
        // Apply urgency filter
        if ($filters['is_urgent'] !== null) {
            $query->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        return $query->orderBy('requests.created_at', 'desc');
    }
    
    private function getRequestsSummaryStats($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        
        $totalRequests = $baseQuery->count();
        
        $pendingQuery = clone $baseQuery;
        $pendingRequests = $pendingQuery->where('requests.status', 'pending')->count();
        
        $approvedQuery = clone $baseQuery;
        $approvedRequests = $approvedQuery->where('requests.status', 'approved')->count();
        
        $rejectedQuery = clone $baseQuery;
        $rejectedRequests = $rejectedQuery->where('requests.status', 'rejected')->count();
        
        $urgentQuery = clone $baseQuery;
        $urgentRequests = $urgentQuery->where('requests.is_urgent', true)->count();
        
        return [
            'total_requests' => $totalRequests,
            'pending_requests' => $pendingRequests,
            'approved_requests' => $approvedRequests,
            'rejected_requests' => $rejectedRequests,
            'urgent_requests' => $urgentRequests,
        ];
    }
    
    private function getRequestsStatusBreakdown($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        
        return $baseQuery->select('requests.status', DB::raw('count(*) as count'))
            ->groupBy('requests.status')
            ->get()
            ->map(function($item) {
                return [
                    'status' => $item->status,
                    'count' => $item->count,
                ];
            });
    }
    
    private function getRequestsDivisionBreakdown($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        
        return $baseQuery->select('divisions.name as division_name', DB::raw('count(*) as count'))
            ->groupBy('divisions.name')
            ->get()
            ->map(function($item) {
                return [
                    'division_name' => $item->division_name ?? 'No Division',
                    'count' => $item->count,
                ];
            });
    }

    private function getCategoryBreakdown($filters)
    {
        $query = DB::table('items')
            ->leftJoin('categories', 'items.category_id', '=', 'categories.id')
            ->select([
                'categories.name as category_name',
                DB::raw('count(*) as item_count'),
                DB::raw('sum(items.quantity_on_hand) as total_quantity')
            ]);
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $query->where('items.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $query->where('items.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        // Division filter not applicable - items table doesn't have division_id
        if ($filters['category'] && $filters['category'] !== 'All Categories') {
            $categoryIds = $this->getCategoryAndChildrenIds($filters['category']);
            $query->whereIn('items.category_id', $categoryIds);
        }
        
        return $query->groupBy('categories.name')
            ->get()
            ->map(function($item) {
                return [
                    'category_name' => $item->category_name ?? 'Uncategorized',
                    'item_count' => $item->item_count,
                    'total_quantity' => $item->total_quantity,
                    'total_value' => 0, // Not available without unit_price column
                ];
            });
    }
    
    private function getDivisionBreakdown($filters)
    {
        // Division breakdown not applicable - items table doesn't have division_id
        // Return empty array or a message indicating this feature is not available
        return [
            [
                'division_name' => 'Not Available',
                'item_count' => 0,
                'total_quantity' => 0,
                'note' => 'Items are not assigned to divisions in the current system'
            ]
        ];
    }
    
    private function getStockStatusBreakdown($filters)
    {
        $baseQuery = DB::table('items')
            ->leftJoin('categories', 'items.category_id', '=', 'categories.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('items.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('items.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        // Division filter not applicable - items table doesn't have division_id
        if ($filters['category'] && $filters['category'] !== 'All Categories') {
            $categoryIds = $this->getCategoryAndChildrenIds($filters['category']);
            $baseQuery->whereIn('items.category_id', $categoryIds);
        }
        
        $total = $baseQuery->count();
        
        $inStockQuery = clone $baseQuery;
        $inStock = $inStockQuery->where('items.quantity_on_hand', '>', 0)->count();
        
        $lowStockQuery = clone $baseQuery;
        $lowStock = $lowStockQuery->where('items.quantity_on_hand', '>', 0)
            ->where('items.reorder_level', '>', 0)
            ->whereColumn('items.quantity_on_hand', '<=', 'items.reorder_level')
            ->count();
        
        $outOfStockQuery = clone $baseQuery;
        $outOfStock = $outOfStockQuery->where('items.quantity_on_hand', '<=', 0)->count();
        
        return [
            'in_stock' => $inStock,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'total' => $total,
        ];
    }
    
    private function getRecentInventoryActivity($filters)
    {
        // Use query builder since we need to join with users table
        $query = DB::table('activity_logs')
            ->leftJoin('users', 'activity_logs.user_id', '=', 'users.id')
            ->where('activity_logs.entity_type', 'Item')
            ->select([
                'activity_logs.id',
                'activity_logs.action',
                'activity_logs.entity_type',
                'activity_logs.entity_id',
                'activity_logs.details',
                'activity_logs.timestamp',
                'users.name as user_name'
            ])
            ->orderBy('activity_logs.timestamp', 'desc')
            ->limit(10);
            
        if ($filters['date_from']) {
            $query->where('activity_logs.timestamp', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $query->where('activity_logs.timestamp', '<=', $filters['date_to'] . ' 23:59:59');
        }
        
        return $query->get()->map(function($log) {
            return [
                'id' => $log->id,
                'description' => $log->details ?? $log->action . ' ' . $log->entity_type,
                'user' => $log->user_name ?? 'System',
                'created_at' => \Carbon\Carbon::parse($log->timestamp)->format('Y-m-d H:i:s'),
            ];
        });
    }
    
    // Additional helper methods for other report types would go here...
    // (buildRequestsQuery, getRequestsSummaryStats, etc.)
    
    private function generateReportData($reportType, $filters)
    {
        // Create a mock request object with the filters
        $request = new HttpRequest();
        $request->merge($filters);
        
        \Log::info('GenerateReportData called:', [
            'report_type' => $reportType,
            'filters' => $filters
        ]);
        
        switch ($reportType) {
            case 'inventory-summary':
                $response = $this->generateInventorySummaryReport($request);
                $data = $response->getData(true);
                $result = $data['data'] ?? $data;
                \Log::info('Inventory Summary Report Data Generated:', [
                    'has_summary' => isset($result['summary']),
                    'has_items' => isset($result['items']),
                    'items_count' => isset($result['items']) ? count($result['items']) : 0
                ]);
                return $result; // Return the actual data array
            case 'supply-requests':
                $response = $this->generateSupplyRequestsReport($request);
                $data = $response->getData(true);
                return $data['data'] ?? $data;
            case 'division-activity':
                $response = $this->generateDivisionActivityReport($request);
                $data = $response->getData(true);
                return $data['data'] ?? $data;
            case 'damaged-items':
                $response = $this->generateDamagedItemsReport($request);
                $data = $response->getData(true);
                return $data['data'] ?? $data;
            case 'user-activity':
                $response = $this->generateUserActivityReport($request);
                $data = $response->getData(true);
                return $data['data'] ?? $data;
            case 'monthly-summary':
                $response = $this->generateMonthlySummaryReport($request);
                $data = $response->getData(true);
                return $data['data'] ?? $data;
            default:
                throw new \Exception('Invalid report type');
        }
    }
    
    private function addReportHeader($sheet, $reportInfo)
    {
        // Set column widths for better header layout
        $sheet->getColumnDimension('A')->setWidth(30);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(30);
        $sheet->getColumnDimension('D')->setWidth(30);
        $sheet->getColumnDimension('E')->setWidth(30);
        
        // Set row heights to fit the logo image properly
        $sheet->getRowDimension('1')->setRowHeight(80);
        $sheet->getRowDimension('2')->setRowHeight(80);
        
        // Add logo image as the main header - sized to perfectly fit the header area
        $logoPath = public_path('images/logo.png');
        if (file_exists($logoPath)) {
            $drawing = new Drawing();
            $drawing->setName('Company Logo Header');
            $drawing->setDescription('Department of Migrant Workers Header Logo');
            $drawing->setPath($logoPath);
            $drawing->setHeight(160);
            $drawing->setWidth(750);
            $drawing->setCoordinates('A1');
            $drawing->setOffsetX(0);
            $drawing->setOffsetY(0);
            $drawing->setWorksheet($sheet);
        }
        
        // Merge cells to create a header area that fits the logo
        $sheet->mergeCells('A1:E2');
        
        // Add report title and details below the header
        $sheet->setCellValue('A4', '');
        $sheet->setCellValue('A5', $reportInfo['title'] ?? 'INVENTORY SUMMARY REPORT');
        $sheet->setCellValue('A6', 'Generated At: ' . ($reportInfo['generated_at'] ?? now()->format('Y-m-d H:i:s')));
        $sheet->setCellValue('A7', 'Generated By: ' . ($reportInfo['generated_by'] ?? 'System'));
        $sheet->setCellValue('A8', 'Total Items: ' . ($reportInfo['total_items'] ?? 'N/A'));
        
        // Style the report title
        $sheet->getStyle('A5')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A6')->getFont()->setSize(11);
        $sheet->getStyle('A7')->getFont()->setSize(11);
        $sheet->getStyle('A8')->getFont()->setSize(11);
        
        // Add a border line under the header
        $sheet->getStyle('A3:E3')->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THICK);
        $sheet->getStyle('A3:E3')->getBorders()->getBottom()->getColor()->setRGB('4472C4');
    }
    
    private function addReportData($sheet, $reportType, $reportData)
    {
        // Ensure we have valid data
        if (!is_array($reportData)) {
            $sheet->setCellValue('A9', 'No data available for this report.');
            return;
        }
        
        $row = 9; // Start after the header rows
        
        // Add summary data
        if (isset($reportData['summary']) && is_array($reportData['summary'])) {
            $sheet->setCellValue('A' . $row, 'Summary Statistics');
            $row++;
            
            foreach ($reportData['summary'] as $key => $value) {
                $sheet->setCellValue('A' . $row, ucwords(str_replace('_', ' ', $key)) . ':');
                $sheet->setCellValue('B' . $row, is_numeric($value) ? number_format($value) : $value);
                $row++;
            }
        }
        
        // Determine report type and generate appropriate content
        $isRequestReport = !empty($reportData['requests']) || isset($reportData['report_info']['total_requests']);
        $requestsData = $reportData['requests'] ?? [];
        
        if ($isRequestReport) {
            // Generate requests report content
            if (isset($requestsData['data']) && is_array($requestsData['data']) && count($requestsData['data']) > 0) {
                $row += 2;
                $sheet->setCellValue('A' . $row, 'Supply Requests Details');
                $row++;
                
                // Add headers
                $headers = ['Request ID', 'Requester', 'Division', 'Status', 'Admin Status', 'Urgent', 'Created Date'];
                $col = 'A';
                foreach ($headers as $header) {
                    $sheet->setCellValue($col . $row, $header);
                    $col++;
                }
                $row++;
                
                // Add data rows
                foreach (array_slice($requestsData['data'], 0, 100) as $request) { // Limit to 100 requests for performance
                    if (!is_array($request)) continue;
                    
                    $col = 'A';
                    $sheet->setCellValue($col . $row, $request['id'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $request['requester_name'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $request['division_name'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, ucwords(str_replace('_', ' ', $request['status'] ?? '')));
                    $col++;
                    $sheet->setCellValue($col . $row, ucwords(str_replace('_', ' ', $request['admin_status'] ?? '')));
                    $col++;
                    $sheet->setCellValue($col . $row, ($request['is_urgent'] ?? 0) ? 'Yes' : 'No');
                    $col++;
                    $sheet->setCellValue($col . $row, isset($request['created_at']) ? date('M j, Y', strtotime($request['created_at'])) : '');
                    $row++;
                }
            } else {
                $row += 2;
                $sheet->setCellValue('A' . $row, 'No Requests Found');
                $row++;
                $sheet->setCellValue('A' . $row, 'No supply requests match the selected filters. Please adjust your filter criteria and try again.');
            }
        } else {
            // Generate inventory report content
            if (isset($reportData['items']) && is_array($reportData['items']) && count($reportData['items']) > 0) {
                $row += 2;
                $sheet->setCellValue('A' . $row, 'Items Details');
                $row++;
                
                // Add headers
                $headers = ['Item No', 'Item Name', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Total Value', 'Stock Status'];
                $col = 'A';
                foreach ($headers as $header) {
                    $sheet->setCellValue($col . $row, $header);
                    $col++;
                }
                $row++;
                
                // Add data rows
                foreach (array_slice($reportData['items'], 0, 100) as $item) { // Limit to 100 items for performance
                    if (!is_array($item)) continue;
                    
                    $col = 'A';
                    $sheet->setCellValue($col . $row, $item['item_no'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $item['item_name'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $item['category'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $item['quantity_on_hand'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $item['unit'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $item['unit_price'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $item['total_value'] ?? '');
                    $col++;
                    $sheet->setCellValue($col . $row, $item['stock_status'] ?? '');
                    $row++;
                }
            } else {
                $row += 2;
                $sheet->setCellValue('A' . $row, 'No Items Found');
                $row++;
                $sheet->setCellValue('A' . $row, 'No inventory items match the selected filters. Please adjust your filter criteria and try again.');
            }
        }
    }
    
    private function generateFilename($reportType, $format)
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        return "{$reportType}_report_{$timestamp}.{$format}";
    }
    
    private function getExportHeaders($format, $filename)
    {
        $contentTypes = [
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv' => 'text/csv',
            'html' => 'text/html',
            'pdf' => 'application/pdf',
            'word' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        
        return [
            'Content-Type' => $contentTypes[strtolower($format)] ?? 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];
    }
    
    private function generateFileContent($spreadsheet, $format, $reportData = null)
    {
        switch (strtolower($format)) {
            case 'xlsx':
            case 'excel':
                $writer = new Xlsx($spreadsheet);
                break;
            case 'csv':
                $writer = new Csv($spreadsheet);
                break;
            case 'html':
                $writer = new Html($spreadsheet);
                break;
            case 'pdf':
                // For PDF, we'll generate a proper PDF using DomPDF
                return $this->generatePdf($reportData);
            case 'word':
            case 'docx':
                // For Word, generate a proper Word document
                return $this->generateWordDocument($reportData);
            default:
                throw new \Exception('Unsupported format: ' . $format . '. Supported formats: xlsx, csv, html, pdf, word');
        }
        
        ob_start();
        $writer->save('php://output');
        return ob_get_clean();
    }
    
    private function generatePdf($reportData)
    {
        $reportInfo = $reportData['report_info'] ?? [];
        $summary = $reportData['summary'] ?? [];
        $items = $reportData['items'] ?? [];
        $requests = $reportData['requests'] ?? [];
        
        // Debug logging for PDF generation
        \Log::info('PDF Generation Debug:', [
            'report_data_keys' => array_keys($reportData),
            'has_report_info' => !empty($reportInfo),
            'has_summary' => !empty($summary),
            'has_items' => !empty($items),
            'has_requests' => !empty($requests),
            'items_count' => is_array($items) ? count($items) : 0,
            'requests_count' => is_array($requests) ? count($requests) : 0,
            'summary_data' => $summary,
            'first_few_items' => is_array($items) ? array_slice($items, 0, 3) : null,
            'first_few_requests' => is_array($requests) ? array_slice($requests, 0, 3) : null
        ]);
        
        // Generate HTML content based on data type
        $html = $this->generateHtmlContent($reportInfo, $summary, $items, $requests);
        
        // Configure DomPDF
        $options = new Options();
        $options->set('defaultFont', 'Arial');
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', true);
        
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        
        return $dompdf->output();
    }
    
    private function formatFiltersForDisplay($filters)
    {
        if (empty($filters)) {
            return 'No filters applied';
        }
        
        $filterStrings = [];
        foreach ($filters as $key => $value) {
            if ($value && $value !== 'All Categories' && $value !== 'All Status' && $value !== 'All Types' && $value !== 'All Divisions') {
                $displayKey = ucwords(str_replace('_', ' ', $key));
                $filterStrings[] = $displayKey . ': ' . $value;
            }
        }
        
        return empty($filterStrings) ? 'No filters applied' : implode(', ', $filterStrings);
    }
    
    private function formatSummaryForDisplay($summary)
    {
        $html = '';
        foreach ($summary as $key => $value) {
            $displayKey = ucwords(str_replace('_', ' ', $key));
            $displayValue = is_numeric($value) ? number_format($value) : $value;
            $html .= '<tr><td><strong>' . $displayKey . ':</strong></td><td>' . $displayValue . '</td></tr>';
        }
        return $html;
    }
    
    private function generateWordDocument($reportData)
    {
        $reportInfo = $reportData['report_info'] ?? [];
        $summary = $reportData['summary'] ?? [];
        $items = $reportData['items'] ?? [];
        $requests = $reportData['requests'] ?? [];
        
        // Create new Word document
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(11);
        
        // Add a section
        $section = $phpWord->addSection([
            'marginTop' => 720,
            'marginBottom' => 720,
            'marginLeft' => 720,
            'marginRight' => 720,
        ]);
        
        // Add header with logo
        $this->addWordHeader($section, $reportInfo);
        
        // Add report title
        $section->addTextBreak(1);
        $section->addText(
            $reportInfo['title'] ?? 'INVENTORY SUMMARY REPORT',
            ['bold' => true, 'size' => 16, 'color' => '2c3e50']
        );
        
        // Add report information section
        $section->addTextBreak(1);
        $section->addText('REPORT INFORMATION', ['bold' => true, 'size' => 14, 'color' => '2c3e50']);
        $section->addTextBreak(1);
        
        $infoTable = $section->addTable([
            'borderSize' => 6,
            'borderColor' => '4472C4',
            'cellMargin' => 80,
        ]);
        
        $infoTable->addRow();
        $infoTable->addCell(2000)->addText('Title:', ['bold' => true]);
        $infoTable->addCell(4000)->addText($reportInfo['title'] ?? 'Report');
        
        $infoTable->addRow();
        $infoTable->addCell(2000)->addText('Generated At:', ['bold' => true]);
        $infoTable->addCell(4000)->addText($reportInfo['generated_at'] ?? now()->format('Y-m-d H:i:s'));
        
        $infoTable->addRow();
        $infoTable->addCell(2000)->addText('Generated By:', ['bold' => true]);
        $infoTable->addCell(4000)->addText($reportInfo['generated_by'] ?? 'System');
        
        $infoTable->addRow();
        $infoTable->addCell(2000)->addText('Total ' . (isset($requests) && !empty($requests) ? 'Requests' : 'Items') . ':', ['bold' => true]);
        $infoTable->addCell(4000)->addText($reportInfo['total_requests'] ?? $reportInfo['total_items'] ?? 'N/A');
        
        $infoTable->addRow();
        $infoTable->addCell(2000)->addText('Filters Applied:', ['bold' => true]);
        $infoTable->addCell(4000)->addText($this->formatFiltersForDisplay($reportInfo['filters_applied'] ?? []));
        
        // Add summary statistics if available
        if (!empty($summary)) {
            $section->addTextBreak(1);
            $section->addText('SUMMARY STATISTICS', ['bold' => true, 'size' => 14, 'color' => '2c3e50']);
            $section->addTextBreak(1);
            
            $table = $section->addTable([
                'borderSize' => 6,
                'borderColor' => '4472C4',
                'cellMargin' => 80,
            ]);
            
            $table->addRow();
            $table->addCell(2000)->addText('Total Items', ['bold' => true]);
            $table->addCell(2000)->addText($summary['total_items'] ?? '0');
            
            $table->addRow();
            $table->addCell(2000)->addText('In Stock', ['bold' => true]);
            $table->addCell(2000)->addText($summary['in_stock'] ?? '0');
            
            $table->addRow();
            $table->addCell(2000)->addText('Low Stock', ['bold' => true]);
            $table->addCell(2000)->addText($summary['low_stock'] ?? '0');
            
            $table->addRow();
            $table->addCell(2000)->addText('Out of Stock', ['bold' => true]);
            $table->addCell(2000)->addText($summary['out_of_stock'] ?? '0');
        }
        
        // Determine report type and generate appropriate content
        $isRequestReport = !empty($requests) || isset($reportInfo['total_requests']);
        $requestsData = $requests['data'] ?? $requests ?? [];
        
        if ($isRequestReport) {
            // Generate requests report content
            if (!empty($requestsData)) {
                $section->addTextBreak(2);
                $section->addText('SUPPLY REQUESTS', ['bold' => true, 'size' => 14, 'color' => '2c3e50']);
                $section->addTextBreak(1);
                
                $table = $section->addTable([
                    'borderSize' => 6,
                    'borderColor' => '4472C4',
                    'cellMargin' => 80,
                ]);
                
                // Add table headers
                $table->addRow();
                $headerCell1 = $table->addCell(1000, ['bgColor' => '4472C4']);
                $headerCell1->addText('REQUEST ID', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell2 = $table->addCell(2000, ['bgColor' => '4472C4']);
                $headerCell2->addText('REQUESTER', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell3 = $table->addCell(1500, ['bgColor' => '4472C4']);
                $headerCell3->addText('DIVISION', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell4 = $table->addCell(1000, ['bgColor' => '4472C4']);
                $headerCell4->addText('STATUS', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell5 = $table->addCell(1000, ['bgColor' => '4472C4']);
                $headerCell5->addText('ADMIN STATUS', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell6 = $table->addCell(1000, ['bgColor' => '4472C4']);
                $headerCell6->addText('URGENT', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell7 = $table->addCell(1500, ['bgColor' => '4472C4']);
                $headerCell7->addText('CREATED DATE', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                // Add table data
                foreach (array_slice($requestsData, 0, 100) as $request) {
                    $table->addRow();
                    $table->addCell(1000)->addText('#' . ($request['id'] ?? ''));
                    $table->addCell(2000)->addText($request['requester_name'] ?? '');
                    $table->addCell(1500)->addText($request['division_name'] ?? '');
                    $table->addCell(1000)->addText(ucwords(str_replace('_', ' ', $request['status'] ?? '')));
                    $table->addCell(1000)->addText(ucwords(str_replace('_', ' ', $request['admin_status'] ?? '')));
                    $table->addCell(1000)->addText(($request['is_urgent'] ?? 0) ? 'Yes' : 'No');
                    $table->addCell(1500)->addText(isset($request['created_at']) ? date('M j, Y', strtotime($request['created_at'])) : '');
                }
            } else {
                $section->addTextBreak(2);
                $section->addText('No Requests Found', ['bold' => true, 'size' => 14, 'color' => 'e74c3c']);
                $section->addText('No supply requests match the selected filters. Please adjust your filter criteria and try again.');
            }
        } else {
            // Generate inventory report content
            if (!empty($items)) {
                $section->addTextBreak(2);
                $section->addText('INVENTORY ITEMS', ['bold' => true, 'size' => 14, 'color' => '2c3e50']);
                $section->addTextBreak(1);
                
                $table = $section->addTable([
                    'borderSize' => 6,
                    'borderColor' => '4472C4',
                    'cellMargin' => 80,
                ]);
                
                // Add table headers with professional styling
                $table->addRow();
                $headerCell1 = $table->addCell(1000, ['bgColor' => '4472C4']);
                $headerCell1->addText('ITEM NO', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell2 = $table->addCell(2000, ['bgColor' => '4472C4']);
                $headerCell2->addText('ITEM NAME', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell3 = $table->addCell(1500, ['bgColor' => '4472C4']);
                $headerCell3->addText('CATEGORY', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell4 = $table->addCell(1000, ['bgColor' => '4472C4']);
                $headerCell4->addText('QUANTITY', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell5 = $table->addCell(1000, ['bgColor' => '4472C4']);
                $headerCell5->addText('UNIT', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell6 = $table->addCell(1500, ['bgColor' => '4472C4']);
                $headerCell6->addText('STOCK STATUS', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                $headerCell7 = $table->addCell(1500, ['bgColor' => '4472C4']);
                $headerCell7->addText('DAMAGE STATUS', ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
                
                // Add table data
                foreach (array_slice($items, 0, 100) as $item) {
                    $table->addRow();
                    $table->addCell(1000)->addText($item['item_no'] ?? '');
                    $table->addCell(2000)->addText($item['item_name'] ?? '');
                    $table->addCell(1500)->addText($item['category'] ?? '');
                    $table->addCell(1000)->addText($item['quantity_on_hand'] ?? '');
                    $table->addCell(1000)->addText($item['unit'] ?? '');
                    $table->addCell(1500)->addText($item['stock_status'] ?? '');
                    $table->addCell(1500)->addText($item['damage_status'] ?? 'Good Condition');
                }
            } else {
                $section->addTextBreak(2);
                $section->addText('No Items Found', ['bold' => true, 'size' => 14, 'color' => 'e74c3c']);
                $section->addText('No inventory items match the selected filters. Please adjust your filter criteria and try again.');
            }
        }
        
        // Add footer
        $section->addTextBreak(3);
        $section->addText('Department of Migrant Workers', ['bold' => true, 'size' => 12, 'color' => '2c3e50']);
        $section->addText('Supplies and Inventory Management System', ['size' => 10, 'color' => '7f8c8d']);
        $section->addText('This report was generated on ' . now()->format('F j, Y \a\t g:i A'), ['size' => 9, 'color' => '95a5a6']);
        
        // Save the document
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        ob_start();
        $objWriter->save('php://output');
        return ob_get_clean();
    }
    
    private function addWordHeader($section, $reportInfo)
    {
        // Add logo if available - fit maximum width
        $logoPath = public_path('images/logo.png');
        if (file_exists($logoPath)) {
            $section->addImage($logoPath, [
                'width' => 500,
                'height' => 150,
                'alignment' => 'center'
            ]);
        }
        
        // Add company information
        $section->addTextBreak(1);
        $section->addText('DEPARTMENT OF MIGRANT WORKERS', [
            'bold' => true, 
            'size' => 18, 
            'color' => '2c3e50',
            'alignment' => 'center'
        ]);
        $section->addText('Supplies and Inventory Management System', [
            'bold' => true, 
            'size' => 12, 
            'color' => '7f8c8d',
            'alignment' => 'center'
        ]);
        $section->addText('YMCA Building, #91, J. Pacana St., Baculio St., Brgy. 21', [
            'size' => 10, 
            'color' => '7f8c8d',
            'alignment' => 'center'
        ]);
        $section->addText('Cagayan de Oro City 9000', [
            'size' => 10, 
            'color' => '7f8c8d',
            'alignment' => 'center'
        ]);
        $section->addText('Website: www.dmw.gov.ph | Email: cdo@dmw.gov.ph', [
            'size' => 9, 
            'color' => '7f8c8d',
            'alignment' => 'center'
        ]);
        $section->addText('Hotlines: (088)8806414, 09569418162', [
            'size' => 9, 
            'color' => '7f8c8d',
            'alignment' => 'center'
        ]);
        
        // Add a border line under the header
        $section->addTextBreak(1);
        $section->addText('', ['border' => 'bottom', 'borderSize' => 6, 'borderColor' => '4472C4']);
    }
    
    private function getLogoBase64()
    {
        $logoPath = public_path('images/logo.png');
        
        if (file_exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = base64_encode($logoData);
            return 'data:image/png;base64,' . $logoBase64;
        }
        
        // Fallback if logo doesn't exist
        return '';
    }
    
    private function generateHtmlContent($reportInfo, $summary, $items, $requests = [])
    {
        $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . ($reportInfo['title'] ?? 'Inventory Report') . '</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f6fa;
            color: #2c3e50;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 0 30px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0;
            position: relative;
        }
        .header-logo {
            margin: 0;
        }
        .header-logo img {
            width: 100%;
            max-height: 120px;
            object-fit: contain;
            display: block;
        }
        .header-content {
            padding: 10px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 5px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
            font-size: 12px;
            opacity: 0.9;
        }
        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .meta-icon {
            width: 16px;
            height: 16px;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            display: inline-block;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            border-left: 4px solid #3498db;
            transition: transform 0.2s ease;
        }
        .stat-card.inventory { border-left-color: #3498db; }
        .stat-card.stock { border-left-color: #2ecc71; }
        .stat-card.damage { border-left-color: #e74c3c; }
        .stat-card.condition { border-left-color: #f39c12; }
        .stat-card h3 {
            font-size: 14px;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .stat-card .value {
            font-size: 36px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .stat-card .subtitle {
            font-size: 12px;
            color: #95a5a6;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 0 0;
            padding: 0 0 5px 0;
            border-bottom: 2px solid #3498db;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-icon {
            width: 24px;
            height: 24px;
            background: #3498db;
            border-radius: 50%;
            display: inline-block;
        }
        .inventory-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            margin: 0 0 20px 0;
        }
        .table-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            font-size: 16px;
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th {
            background: #f8f9fa;
            color: #2c3e50;
            font-weight: 600;
            padding: 15px 12px;
            text-align: left;
            border-bottom: 2px solid #e9ecef;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        td {
            padding: 15px 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: middle;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-in-stock {
            background: #d4edda;
            color: #155724;
        }
        .status-low-stock {
            background: #fff3cd;
            color: #856404;
        }
        .status-out-of-stock {
            background: #f8d7da;
            color: #721c24;
        }
        .status-damaged {
            background: #f8d7da;
            color: #721c24;
        }
        .status-under-repair {
            background: #cce5ff;
            color: #004085;
        }
        .status-disposed {
            background: #e2e3e5;
            color: #383d41;
        }
        .status-good-condition {
            background: #d4edda;
            color: #155724;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        .status-approved {
            background: #d4edda;
            color: #155724;
        }
        .status-rejected {
            background: #f8d7da;
            color: #721c24;
        }
        .status-cancelled {
            background: #e2e3e5;
            color: #383d41;
        }
        .status-urgent {
            background: #f8d7da;
            color: #721c24;
        }
        .status-normal {
            background: #d1ecf1;
            color: #0c5460;
        }
        .item-number {
            font-family: "Courier New", monospace;
            font-weight: 600;
            color: #3498db;
        }
        .category-tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }
        .quantity {
            font-weight: 600;
            color: #2c3e50;
        }
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding-top: 0;
        }
        .footer {
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
            margin-top: auto;
        }
        .footer h3 {
            font-size: 18px;
            margin-bottom: 10px;
        }
        .footer p {
            font-size: 14px;
            opacity: 0.8;
            margin: 5px 0;
        }
        .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #7f8c8d;
        }
        .no-data-icon {
            width: 80px;
            height: 80px;
            background: #ecf0f1;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: #bdc3c7;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ' . ($this->getLogoBase64() ? '<div class="header-logo"><img src="' . $this->getLogoBase64() . '" alt="Company Logo" /></div>' : '') . '
            <div class="header-content">
                <h1>' . ($reportInfo['title'] ?? 'Inventory Summary Report') . '</h1>
                <div class="header-meta">
                    <div class="meta-item">
                        <span class="meta-icon"></span>
                        <span>Generated: ' . ($reportInfo['generated_at'] ?? now()->format('Y-m-d H:i:s')) . '</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon"></span>
                        <span>Generated By: ' . ($reportInfo['generated_by'] ?? 'System') . '</span>
                    </div>
                </div>
            </div>
        </div>
        ';
        
        $html .= '
        <div class="main-content">
            <!-- Report Information Section -->
            <div class="section-title">
                <span class="section-icon"></span>
                Report Information
            </div>
            <div class="info-table">
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Title:</strong></td>
                            <td>' . ($reportInfo['title'] ?? 'Report') . '</td>
                        </tr>
                        <tr>
                            <td><strong>Generated At:</strong></td>
                            <td>' . ($reportInfo['generated_at'] ?? now()->format('Y-m-d H:i:s')) . '</td>
                        </tr>
                        <tr>
                            <td><strong>Generated By:</strong></td>
                            <td>' . ($reportInfo['generated_by'] ?? 'System') . '</td>
                        </tr>
                        <tr>
                            <td><strong>Total ' . (isset($requests) && !empty($requests) ? 'Requests' : 'Items') . ':</strong></td>
                            <td>' . ($reportInfo['total_requests'] ?? $reportInfo['total_items'] ?? 'N/A') . '</td>
                        </tr>
                        <tr>
                            <td><strong>Filters Applied:</strong></td>
                            <td>' . $this->formatFiltersForDisplay($reportInfo['filters_applied'] ?? []) . '</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Summary Statistics Section -->
            ' . (!empty($summary) ? '
            <div class="section-title">
                <span class="section-icon"></span>
                Summary Statistics
            </div>
            <div class="summary-table">
                <table>
                    <tbody>
                        ' . $this->formatSummaryForDisplay($summary) . '
                    </tbody>
                </table>
            </div>
            ' : '') . '
            
            <div class="section-title">
                <span class="section-icon"></span>
                ' . (isset($requests) && !empty($requests) ? 'Supply Requests' : 'Inventory Items') . '
            </div>
            <div class="inventory-table">
                <div class="table-header">
                    ' . (isset($requests) && !empty($requests) ? '📋 Supply Requests Management System' : '📦 Inventory Management System') . '
                </div>';
        
        // Determine report type and generate appropriate content
        $isRequestReport = !empty($requests) || isset($reportInfo['total_requests']);
        $requestsData = $requests['data'] ?? $requests ?? [];
        
        if ($isRequestReport) {
            // Generate requests report content
            if (!empty($requestsData)) {
                $html .= '
                    <table>
                        <thead>
                            <tr>
                                <th>Request ID</th>
                                <th>Requester</th>
                                <th>Division</th>
                                <th>Status</th>
                                <th>Admin Status</th>
                                <th>Urgent</th>
                                <th>Created Date</th>
                            </tr>
                        </thead>
                        <tbody>';
                
                foreach (array_slice($requestsData, 0, 100) as $request) {
                    // Status styling
                    $statusClass = '';
                    $status = $request['status'] ?? '';
                    switch (strtolower($status)) {
                        case 'pending':
                            $statusClass = 'status-pending';
                            break;
                        case 'evaluator_approved':
                            $statusClass = 'status-approved';
                            break;
                        case 'admin_approved':
                            $statusClass = 'status-approved';
                            break;
                        case 'rejected':
                            $statusClass = 'status-rejected';
                            break;
                        case 'cancelled':
                            $statusClass = 'status-cancelled';
                            break;
                    }
                    
                    $adminStatusClass = '';
                    $adminStatus = $request['admin_status'] ?? '';
                    switch (strtolower($adminStatus)) {
                        case 'pending':
                            $adminStatusClass = 'status-pending';
                            break;
                        case 'approved':
                            $adminStatusClass = 'status-approved';
                            break;
                        case 'rejected':
                            $adminStatusClass = 'status-rejected';
                            break;
                    }
                    
                    $urgentText = ($request['is_urgent'] ?? 0) ? 'Yes' : 'No';
                    $urgentClass = ($request['is_urgent'] ?? 0) ? 'status-urgent' : 'status-normal';
                    
                    $html .= '
                        <tr>
                            <td><span class="item-number">#' . ($request['id'] ?? '') . '</span></td>
                            <td><strong>' . ($request['requester_name'] ?? '') . '</strong></td>
                            <td>' . ($request['division_name'] ?? '') . '</td>
                            <td><span class="status-badge ' . $statusClass . '">' . ucwords(str_replace('_', ' ', $status)) . '</span></td>
                            <td><span class="status-badge ' . $adminStatusClass . '">' . ucwords(str_replace('_', ' ', $adminStatus)) . '</span></td>
                            <td><span class="status-badge ' . $urgentClass . '">' . $urgentText . '</span></td>
                            <td>' . (isset($request['created_at']) ? date('M j, Y', strtotime($request['created_at'])) : '') . '</td>
                        </tr>';
                }
                
                $html .= '
                        </tbody>
                    </table>';
            } else {
                $html .= '
                    <div class="no-data">
                        <div class="no-data-icon">📋</div>
                        <h3>No Requests Found</h3>
                        <p>No supply requests match the selected filters. Please adjust your filter criteria and try again.</p>
                    </div>';
            }
        } else {
            // Generate inventory report content
            if (!empty($items)) {
                $html .= '
                    <table>
                        <thead>
                            <tr>
                                <th>Item No</th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Stock Status</th>
                                <th>Damage Status</th>
                            </tr>
                        </thead>
                        <tbody>';
                
                foreach (array_slice($items, 0, 100) as $item) {
                    // Stock status styling
                    $stockStatusClass = '';
                    $stockStatus = $item['stock_status'] ?? '';
                    switch (strtolower($stockStatus)) {
                        case 'in stock':
                            $stockStatusClass = 'status-in-stock';
                            break;
                        case 'low stock':
                            $stockStatusClass = 'status-low-stock';
                            break;
                        case 'out of stock':
                            $stockStatusClass = 'status-out-of-stock';
                            break;
                    }
                    
                    // Damage status styling
                    $damageStatusClass = '';
                    $damageStatus = $item['damage_status'] ?? 'Good Condition';
                    switch (strtolower($damageStatus)) {
                        case 'damaged':
                            $damageStatusClass = 'status-damaged';
                            break;
                        case 'under repair':
                            $damageStatusClass = 'status-under-repair';
                            break;
                        case 'disposed':
                            $damageStatusClass = 'status-disposed';
                            break;
                        case 'good condition':
                            $damageStatusClass = 'status-good-condition';
                            break;
                    }
                    
                    $html .= '
                        <tr>
                            <td><span class="item-number">' . ($item['item_no'] ?? '') . '</span></td>
                            <td><strong>' . ($item['item_name'] ?? '') . '</strong></td>
                            <td><span class="category-tag">' . ($item['category'] ?? '') . '</span></td>
                            <td><span class="quantity">' . ($item['quantity_on_hand'] ?? '') . '</span></td>
                            <td>' . ($item['unit'] ?? '') . '</td>
                            <td><span class="status-badge ' . $stockStatusClass . '">' . $stockStatus . '</span></td>
                            <td><span class="status-badge ' . $damageStatusClass . '">' . $damageStatus . '</span></td>
                        </tr>';
                }
                
                $html .= '
                        </tbody>
                    </table>';
            } else {
                $html .= '
                    <div class="no-data">
                        <div class="no-data-icon">📦</div>
                        <h3>No Items Found</h3>
                        <p>No inventory items match the selected filters. Please adjust your filter criteria and try again.</p>
                    </div>';
            }
        }
        
        $html .= '
        </div>
        
        <div class="footer">
            <h3>Department of Migrant Workers</h3>
            <p>Supplies and Inventory Management System</p>
            <p>This report was generated on ' . now()->format('F j, Y \a\t g:i A') . '</p>
        </div>
    </div>
</body>
</html>';
        
        return $html;
    }

    // ========================================
    // COMPREHENSIVE SUMMARY REQUEST REPORT HELPER METHODS
    // ========================================

    /**
     * Build detailed requests query with all related information
     */
    private function buildDetailedRequestsQuery($filters)
    {
        $query = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('users as evaluator', 'requests.evaluator_id', '=', 'evaluator.id')
            ->leftJoin('users as admin', 'requests.admin_id', '=', 'admin.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id')
            ->select([
                'requests.id',
                'requests.status',
                'requests.evaluator_status',
                'requests.admin_status',
                'requests.is_urgent',
                'requests.remarks',
                'requests.needed_date',
                'requests.created_at',
                'requests.updated_at',
                'requests.evaluator_approved_at',
                'requests.admin_approved_at',
                'requests.ready_for_pickup',
                'requests.is_done',
                'requests.received_by',
                'requester.name as requester_name',
                'requester.email as requester_email',
                'requester.user_role as requester_role',
                'evaluator.name as evaluator_name',
                'admin.name as admin_name',
                'divisions.name as division_name',
                DB::raw('CASE 
                    WHEN requests.status = "cancelled" THEN "Cancelled"
                    WHEN requests.ready_for_pickup = 1 THEN "Completed"
                    WHEN requests.evaluator_status IS NULL OR requests.evaluator_status = "pending" THEN "Awaiting Division Chief Approval"
                    WHEN requests.evaluator_status = "approved" AND (requests.admin_status IS NULL OR requests.admin_status = "pending") THEN "Awaiting Admin Approval"
                    WHEN requests.evaluator_status = "approved" AND requests.admin_status = "approved" AND requests.ready_for_pickup = 0 THEN "Admin is preparing the items"
                    ELSE requests.status
                END as display_status')
            ]);
        
        // Apply date filters
        if ($filters['date_from']) {
            $query->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $query->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        
        // Apply division filter
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $query->where('divisions.name', $filters['division']);
        }
        
        // Apply status filter
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $query->where('requests.status', $filters['status']);
        }
        
        // Apply urgency filter
        if ($filters['is_urgent'] !== null) {
            $query->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        return $query->orderBy('requests.created_at', 'desc');
    }

    /**
     * Get comprehensive request summary statistics
     */
    private function getComprehensiveRequestSummary($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        $totalRequests = $baseQuery->count();
        
        // Status breakdown
        $pendingRequests = (clone $baseQuery)->where('requests.status', 'pending')->count();
        $evaluatorApprovedRequests = (clone $baseQuery)->where('requests.status', 'evaluator_approved')->count();
        $adminApprovedRequests = (clone $baseQuery)->where('requests.status', 'admin_approved')->count();
        $rejectedRequests = (clone $baseQuery)->where('requests.status', 'rejected')->count();
        $cancelledRequests = (clone $baseQuery)->where('requests.status', 'cancelled')->count();
        $completedRequests = (clone $baseQuery)->where('requests.ready_for_pickup', 1)->count();
        
        // Urgency breakdown
        $urgentRequests = (clone $baseQuery)->where('requests.is_urgent', true)->count();
        $normalRequests = (clone $baseQuery)->where('requests.is_urgent', false)->count();
        
        // Workflow status breakdown
        $awaitingDivisionChief = (clone $baseQuery)
            ->where(function($q) {
                $q->whereNull('requests.evaluator_status')
                  ->orWhere('requests.evaluator_status', 'pending');
            })->count();
            
        $awaitingAdmin = (clone $baseQuery)
            ->where('requests.evaluator_status', 'approved')
            ->where(function($q) {
                $q->whereNull('requests.admin_status')
                  ->orWhere('requests.admin_status', 'pending');
            })->count();
            
        $inPreparation = (clone $baseQuery)
            ->where('requests.evaluator_status', 'approved')
            ->where('requests.admin_status', 'approved')
            ->where('requests.ready_for_pickup', 0)->count();
        
        // Calculate average processing time
        $avgProcessingTime = $this->calculateAverageProcessingTime($filters);
        
        return [
            'total_requests' => $totalRequests,
            'pending_requests' => $pendingRequests,
            'evaluator_approved_requests' => $evaluatorApprovedRequests,
            'admin_approved_requests' => $adminApprovedRequests,
            'rejected_requests' => $rejectedRequests,
            'cancelled_requests' => $cancelledRequests,
            'completed_requests' => $completedRequests,
            'urgent_requests' => $urgentRequests,
            'normal_requests' => $normalRequests,
            'awaiting_division_chief' => $awaitingDivisionChief,
            'awaiting_admin' => $awaitingAdmin,
            'in_preparation' => $inPreparation,
            'average_processing_time_hours' => $avgProcessingTime,
        ];
    }

    /**
     * Get detailed status breakdown
     */
    private function getDetailedStatusBreakdown($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        return $baseQuery->select(
            'requests.status',
            'requests.evaluator_status',
            'requests.admin_status',
            'requests.ready_for_pickup',
            DB::raw('count(*) as count'),
            DB::raw('AVG(TIMESTAMPDIFF(HOUR, requests.created_at, COALESCE(requests.updated_at, NOW()))) as avg_processing_hours')
        )
        ->groupBy('requests.status', 'requests.evaluator_status', 'requests.admin_status', 'requests.ready_for_pickup')
        ->get()
        ->map(function($item) {
            return [
                'status' => $item->status,
                'evaluator_status' => $item->evaluator_status,
                'admin_status' => $item->admin_status,
                'ready_for_pickup' => $item->ready_for_pickup,
                'count' => $item->count,
                'avg_processing_hours' => round($item->avg_processing_hours, 2),
            ];
        });
    }

    /**
     * Get detailed division breakdown
     */
    private function getDetailedDivisionBreakdown($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        return $baseQuery->select(
            'divisions.name as division_name',
            DB::raw('count(*) as total_requests'),
            DB::raw('SUM(CASE WHEN requests.is_urgent = 1 THEN 1 ELSE 0 END) as urgent_requests'),
            DB::raw('SUM(CASE WHEN requests.status = "pending" THEN 1 ELSE 0 END) as pending_requests'),
            DB::raw('SUM(CASE WHEN requests.status = "cancelled" THEN 1 ELSE 0 END) as cancelled_requests'),
            DB::raw('SUM(CASE WHEN requests.ready_for_pickup = 1 THEN 1 ELSE 0 END) as completed_requests'),
            DB::raw('AVG(TIMESTAMPDIFF(HOUR, requests.created_at, COALESCE(requests.updated_at, NOW()))) as avg_processing_hours')
        )
        ->groupBy('divisions.name')
        ->get()
        ->map(function($item) {
            return [
                'division_name' => $item->division_name ?? 'No Division',
                'total_requests' => $item->total_requests,
                'urgent_requests' => $item->urgent_requests,
                'pending_requests' => $item->pending_requests,
                'cancelled_requests' => $item->cancelled_requests,
                'completed_requests' => $item->completed_requests,
                'avg_processing_hours' => round($item->avg_processing_hours, 2),
            ];
        });
    }

    /**
     * Get workflow breakdown
     */
    private function getWorkflowBreakdown($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        return [
            'awaiting_division_chief' => (clone $baseQuery)
                ->where(function($q) {
                    $q->whereNull('requests.evaluator_status')
                      ->orWhere('requests.evaluator_status', 'pending');
                })->count(),
            'awaiting_admin' => (clone $baseQuery)
                ->where('requests.evaluator_status', 'approved')
                ->where(function($q) {
                    $q->whereNull('requests.admin_status')
                      ->orWhere('requests.admin_status', 'pending');
                })->count(),
            'in_preparation' => (clone $baseQuery)
                ->where('requests.evaluator_status', 'approved')
                ->where('requests.admin_status', 'approved')
                ->where('requests.ready_for_pickup', 0)->count(),
            'ready_for_pickup' => (clone $baseQuery)
                ->where('requests.ready_for_pickup', 1)->count(),
            'completed' => (clone $baseQuery)
                ->whereNotNull('requests.is_done')->count(),
        ];
    }

    /**
     * Get urgency breakdown
     */
    private function getUrgencyBreakdown($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        
        return [
            'urgent' => (clone $baseQuery)->where('requests.is_urgent', true)->count(),
            'normal' => (clone $baseQuery)->where('requests.is_urgent', false)->count(),
        ];
    }

    /**
     * Get request timeline analysis
     */
    private function getRequestTimelineAnalysis($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        // Get requests created by day
        $dailyRequests = (clone $baseQuery)
            ->select(
                DB::raw('DATE(requests.created_at) as date'),
                DB::raw('count(*) as count'),
                DB::raw('SUM(CASE WHEN requests.is_urgent = 1 THEN 1 ELSE 0 END) as urgent_count')
            )
            ->groupBy(DB::raw('DATE(requests.created_at)'))
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();
        
        return [
            'daily_requests' => $dailyRequests,
            'peak_day' => $dailyRequests->sortByDesc('count')->first(),
            'total_days_analyzed' => $dailyRequests->count(),
        ];
    }

    /**
     * Get request performance metrics
     */
    private function getRequestPerformanceMetrics($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        $totalRequests = $baseQuery->count();
        $completedRequests = (clone $baseQuery)->where('requests.ready_for_pickup', 1)->count();
        $cancelledRequests = (clone $baseQuery)->where('requests.status', 'cancelled')->count();
        
        return [
            'total_requests' => $totalRequests,
            'completion_rate' => $totalRequests > 0 ? round(($completedRequests / $totalRequests) * 100, 2) : 0,
            'cancellation_rate' => $totalRequests > 0 ? round(($cancelledRequests / $totalRequests) * 100, 2) : 0,
            'average_processing_time_hours' => $this->calculateAverageProcessingTime($filters),
            'fastest_completion_hours' => $this->getFastestCompletionTime($filters),
            'slowest_completion_hours' => $this->getSlowestCompletionTime($filters),
        ];
    }

    /**
     * Get top requesters
     */
    private function getTopRequesters($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        return $baseQuery->select(
            'requester.name as requester_name',
            'requester.email as requester_email',
            'divisions.name as division_name',
            DB::raw('count(*) as total_requests'),
            DB::raw('SUM(CASE WHEN requests.is_urgent = 1 THEN 1 ELSE 0 END) as urgent_requests'),
            DB::raw('SUM(CASE WHEN requests.ready_for_pickup = 1 THEN 1 ELSE 0 END) as completed_requests'),
            DB::raw('AVG(TIMESTAMPDIFF(HOUR, requests.created_at, COALESCE(requests.updated_at, NOW()))) as avg_processing_hours')
        )
        ->groupBy('requester.id', 'requester.name', 'requester.email', 'divisions.name')
        ->orderBy('total_requests', 'desc')
        ->limit(10)
        ->get()
        ->map(function($item) {
            return [
                'requester_name' => $item->requester_name,
                'requester_email' => $item->requester_email,
                'division_name' => $item->division_name ?? 'No Division',
                'total_requests' => $item->total_requests,
                'urgent_requests' => $item->urgent_requests,
                'completed_requests' => $item->completed_requests,
                'avg_processing_hours' => round($item->avg_processing_hours, 2),
            ];
        });
    }

    /**
     * Get item request analysis
     */
    private function getItemRequestAnalysis($filters)
    {
        $baseQuery = DB::table('item_request')
            ->join('requests', 'item_request.request_id', '=', 'requests.id')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id')
            ->join('items', 'item_request.item_id', '=', 'items.id')
            ->leftJoin('categories', 'items.category_id', '=', 'categories.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        // Most requested items
        $mostRequestedItems = (clone $baseQuery)
            ->select(
                'items.item_name',
                'items.item_no',
                'categories.name as category_name',
                DB::raw('count(*) as request_count'),
                DB::raw('SUM(item_request.quantity) as total_quantity_requested')
            )
            ->groupBy('items.id', 'items.item_name', 'items.item_no', 'categories.name')
            ->orderBy('request_count', 'desc')
            ->limit(10)
            ->get();
        
        // Most requested categories
        $mostRequestedCategories = (clone $baseQuery)
            ->select(
                'categories.name as category_name',
                DB::raw('count(*) as request_count'),
                DB::raw('SUM(item_request.quantity) as total_quantity_requested')
            )
            ->groupBy('categories.name')
            ->orderBy('request_count', 'desc')
            ->limit(10)
            ->get();
        
        return [
            'most_requested_items' => $mostRequestedItems,
            'most_requested_categories' => $mostRequestedCategories,
        ];
    }

    /**
     * Calculate average processing time
     */
    private function calculateAverageProcessingTime($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id');
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        $avgTime = $baseQuery->selectRaw('AVG(TIMESTAMPDIFF(HOUR, requests.created_at, COALESCE(requests.updated_at, NOW()))) as avg_hours')
            ->value('avg_hours');
        
        return round($avgTime ?? 0, 2);
    }

    /**
     * Get fastest completion time
     */
    private function getFastestCompletionTime($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id')
            ->where('requests.ready_for_pickup', 1);
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        $fastestTime = $baseQuery->selectRaw('MIN(TIMESTAMPDIFF(HOUR, requests.created_at, requests.updated_at)) as min_hours')
            ->value('min_hours');
        
        return round($fastestTime ?? 0, 2);
    }

    /**
     * Get slowest completion time
     */
    private function getSlowestCompletionTime($filters)
    {
        $baseQuery = DB::table('requests')
            ->join('users as requester', 'requests.user_id', '=', 'requester.id')
            ->leftJoin('divisions', 'requester.division_id', '=', 'divisions.id')
            ->where('requests.ready_for_pickup', 1);
        
        // Apply same filters as main query
        if ($filters['date_from']) {
            $baseQuery->where('requests.created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }
        if ($filters['date_to']) {
            $baseQuery->where('requests.created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        if ($filters['division'] && $filters['division'] !== 'All Divisions') {
            $baseQuery->where('divisions.name', $filters['division']);
        }
        if ($filters['status'] && $filters['status'] !== 'All Status') {
            $baseQuery->where('requests.status', $filters['status']);
        }
        if ($filters['is_urgent'] !== null) {
            $baseQuery->where('requests.is_urgent', $filters['is_urgent']);
        }
        
        $slowestTime = $baseQuery->selectRaw('MAX(TIMESTAMPDIFF(HOUR, requests.created_at, requests.updated_at)) as max_hours')
            ->value('max_hours');
        
        return round($slowestTime ?? 0, 2);
    }

    /**
     * Get report period description
     */
    private function getReportPeriod($filters)
    {
        if ($filters['date_from'] && $filters['date_to']) {
            return "From {$filters['date_from']} to {$filters['date_to']}";
        } elseif ($filters['date_from']) {
            return "From {$filters['date_from']} onwards";
        } elseif ($filters['date_to']) {
            return "Up to {$filters['date_to']}";
        } else {
            return "All time";
        }
    }
    
}
