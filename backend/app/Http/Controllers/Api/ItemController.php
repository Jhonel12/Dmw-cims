<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Item;
use App\Models\Category;
use App\Services\Import\ItemImportService;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ItemController extends Controller
{
    use LogsActivity;

    /**
     * Test low stock filter
     */
    public function testLowStock()
    {
        $lowStockItems = Item::where('quantity_on_hand', '>', 0)
            ->where(function ($subQuery) {
                $subQuery->where('quantity_on_hand', '<=', 5)
                    ->orWhere(function ($q) {
                        $q->where('reorder_level', '>', 0)
                            ->whereColumn('quantity_on_hand', '<=', 'reorder_level');
                    });
            })
            ->get(['id', 'item_name', 'quantity_on_hand', 'reorder_level']);

        return response()->json([
            'status' => 'success',
            'data' => $lowStockItems
        ]);
    }

    /**
     * Get inventory statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getInventoryStats()
    {
        try {
            // Get total number of items
            $totalItems = Item::count();

            // Get number of items that are in stock (quantity_on_hand > 5 AND not low stock by reorder level)
            $inStockItems = Item::where('quantity_on_hand', '>', 5)
                ->where(function ($query) {
                    $query->whereRaw('(quantity_on_hand > reorder_level OR reorder_level IS NULL OR reorder_level = 0)');
                })
                ->count();

            // Get number of items that are low on stock 
            // (quantity_on_hand <= 5 OR (quantity_on_hand <= reorder_level AND quantity_on_hand > 0 AND reorder_level > 0))
            $lowStockItems = Item::where('quantity_on_hand', '>', 0)
                ->where(function ($query) {
                    $query->where('quantity_on_hand', '<=', 5)
                        ->orWhere(function ($subQuery) {
                            $subQuery->where('reorder_level', '>', 0)
                                ->whereColumn('quantity_on_hand', '<=', 'reorder_level');
                        });
                })
                ->count();

            // Get number of items that are out of stock (quantity_on_hand = 0)
            $outOfStockItems = Item::where('quantity_on_hand', '=', 0)->count();

            // Create a simple stats object that matches our frontend model
            $stats = (object) [
                'total_items' => $totalItems,
                'in_stock_items' => $inStockItems,
                'low_stock_items' => $lowStockItems,
                'out_of_stock_items' => $outOfStockItems
            ];

            // Return in the same format as DivisionController getStatistics
            return response()->json([
                'status' => 'success',
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve inventory statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Item::with('category');

        // Filter by category if provided
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by supplier if provided
        if ($request->has('supplier') && $request->supplier) {
            $query->where('supplier', $request->supplier);
        }

        // Filter by location if provided
        if ($request->has('location') && $request->location) {
            $query->where('location', $request->location);
        }

        // Search by name, item_no
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('item_no', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by stock status
        \Log::info('Checking stock status filter:', [
            'has_stock_status' => $request->has('stock_status'),
            'stock_status_value' => $request->input('stock_status'),
            'has_low_stock' => $request->has('low_stock'),
            'low_stock_value' => $request->input('low_stock'),
            'all_params' => $request->all()
        ]);

        if (($request->has('stock_status') && $request->stock_status) || ($request->has('low_stock') && $request->low_stock)) {
            \Log::info('Stock status filter applied:', [
                'stock_status' => $request->stock_status,
                'request_params' => $request->all()
            ]);

            $stockStatus = $request->stock_status ?? ($request->low_stock ? 'low_stock' : null);

            switch ($stockStatus) {
                case 'low_stock':
                    $query->where('quantity_on_hand', '>', 0)
                        ->where(function ($subQuery) {
                            $subQuery->where('quantity_on_hand', '<=', 5)
                                ->orWhere(function ($q) {
                                    $q->where('reorder_level', '>', 0)
                                        ->whereColumn('quantity_on_hand', '<=', 'reorder_level');
                                });
                        });
                    \Log::info('Low stock filter applied to query');
                    break;
                case 'in_stock':
                    // In stock: more than 5 on hand AND not at/below reorder level (or no reorder level defined)
                    $query->where('quantity_on_hand', '>', 5)
                        ->where(function ($q) {
                            $q->whereRaw('(quantity_on_hand > reorder_level)')
                                ->orWhereNull('reorder_level')
                                ->orWhere('reorder_level', '=', 0);
                        });
                    break;
                case 'out_of_stock':
                    $query->where('quantity_on_hand', '<=', 0);
                    break;
            }
        } else {
            \Log::info('No stock status filter applied');
        }

        // Sort items
        $sortField = $request->input('sort_field', 'item_name');
        $sortDirection = $request->input('sort_direction', 'asc');

        // Validate sort field
        $allowedSortFields = ['item_name', 'item_no', 'quantity_on_hand', 'last_ordered_date'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'item_name';
        }

        $query->orderBy($sortField, $sortDirection);

        // Paginate results
        $perPage = $request->input('per_page', 15);
        $items = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $items
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Define validation rules with grouping for better organization
        $rules = [
            // Item identification
            'item_no' => 'nullable|string|max:50|unique:items,item_no,NULL,id,item_no,!NULL',
            'itemNo' => 'nullable|string|max:50',

            // Name (required)
            'item_name' => 'required|string|max:255',
            'itemName' => 'nullable|string|max:255',

            // Classification
            'category_id' => 'nullable|exists:categories,id|nullable',
            'category' => 'nullable|string',
            'description' => 'nullable|string',

            // Quantity and units
            'quantity_on_hand' => 'nullable|integer|min:0',
            'quantityOnHand' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',

            // Reorder information
            'reorder_level' => 'nullable|integer|min:0',
            'reorderLevel' => 'nullable|integer|min:0',
            'reorder_quantity' => 'nullable|integer|min:0',
            'reorderQuantity' => 'nullable|integer|min:0',

            // Additional information
            'supplier' => 'nullable|string|max:255',
            'last_ordered_date' => 'nullable|date',
            'lastOrderedDate' => 'nullable|date',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get request data and explicitly set import flag to false
        $itemData = $request->all();
        $itemData['__isBulkImport'] = false;

        // Convert camelCase to snake_case keys
        $normalizedData = $this->normalizeItemData($itemData);

        // Check if item with the same name already exists
        $existingItem = Item::where('item_name', $normalizedData['item_name'])->first();

        if ($existingItem) {
            // Item already exists, return error so user can manually adjust quantity
            return response()->json([
                'status' => 'error',
                'message' => 'Item with this name already exists. Please update the existing item\'s quantity instead.',
                'error_code' => 'DUPLICATE_ITEM_NAME',
                'existing_item' => [
                    'id' => $existingItem->id,
                    'item_name' => $existingItem->item_name,
                    'current_quantity' => $existingItem->quantity_on_hand ?? 0,
                    'unit' => $existingItem->unit,
                    'category' => $existingItem->category_id ? optional($existingItem->category)->name : null
                ],
                'suggestion' => 'Use the edit function to update the quantity of the existing item.'
            ], 409); // 409 Conflict status code
        }

        // Item doesn't exist, create new one
        $item = Item::create($normalizedData);

        // Log the item creation with detailed information
        try {
            // Get category name if available
            $categoryName = '';
            if ($item->category_id) {
                $category = Category::find($item->category_id);
                $categoryName = $category ? $category->name : '';
            }

            // Use the enhanced logging method
            $this->logItemCreation(
                $item->id,
                $item->item_name,
                $item->quantity_on_hand ?? 0,
                $categoryName
            );

            \Log::debug('Activity log created for item: ' . $item->id);
        } catch (\Exception $e) {
            // Log the error but don't fail the request
            \Log::error('Failed to create activity log: ' . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Item created successfully',
            'data' => $item,
            'action' => 'created'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $item = Item::with('category')->find($id);

        if (!$item) {
            return response()->json([
                'status' => 'error',
                'message' => 'Item not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $item
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $item = Item::find($id);

        if (!$item) {
            return response()->json([
                'status' => 'error',
                'message' => 'Item not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'item_no' => 'nullable|string|max:50|unique:items,item_no,' . $id,
            'itemNo' => 'nullable|string|max:50',
            'item_name' => 'required|string|max:255',
            'itemName' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id|nullable',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'quantity_on_hand' => 'nullable|integer|min:0',
            'quantityOnHand' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'reorder_level' => 'nullable|integer|min:0',
            'reorderLevel' => 'nullable|integer|min:0',
            'reorder_quantity' => 'nullable|integer|min:0',
            'reorderQuantity' => 'nullable|integer|min:0',
            'supplier' => 'nullable|string|max:255',
            'last_ordered_date' => 'nullable|date',
            'lastOrderedDate' => 'nullable|date',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get request data and explicitly set import flag to false
        $itemData = $request->all();
        $itemData['__isBulkImport'] = false;

        // Convert camelCase to snake_case keys
        $normalizedData = $this->normalizeItemData($itemData);

        // Track changes before updating
        $changes = [];
        $oldQuantity = $item->quantity_on_hand;

        // Check for quantity changes
        if (isset($normalizedData['quantity_on_hand']) && $normalizedData['quantity_on_hand'] != $oldQuantity) {
            $changes['quantity_on_hand'] = [$oldQuantity, $normalizedData['quantity_on_hand']];
        }

        // Check for other field changes
        $trackableFields = ['item_name', 'description', 'category_id', 'unit_price', 'reorder_level'];
        foreach ($trackableFields as $field) {
            if (isset($normalizedData[$field]) && $normalizedData[$field] != $item->$field) {
                $changes[$field] = [$item->$field, $normalizedData[$field]];
            }
        }

        $item->update($normalizedData);

        // Log the item update with detailed changes
        try {
            if (!empty($changes)) {
                // Use the enhanced logging method
                $this->logItemUpdate($item->id, $item->item_name, $changes);
            } else {
                // Log a general update if no specific changes were tracked
                $this->logUpdate('Item', $item->id, "Updated item: {$item->item_name}");
            }

            \Log::debug('Activity log created for updated item: ' . $item->id);
        } catch (\Exception $e) {
            // Log the error but don't fail the request
            \Log::error('Failed to create activity log: ' . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Item updated successfully',
            'data' => $item
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $item = Item::find($id);

        if (!$item) {
            return response()->json([
                'status' => 'error',
                'message' => 'Item not found'
            ], 404);
        }

        // Store item details before deletion for logging
        $itemName = $item->item_name;
        $itemId = $item->id;

        // Delete the item first
        $item->delete();

        // Log the activity after deletion
        try {
            // Debug authentication status
            \Log::debug('Delete Auth Status: ' . (auth()->check() ? 'Authenticated' : 'Not Authenticated'));
            \Log::debug('Delete Auth User ID: ' . (auth()->check() ? auth()->id() : 'None'));

            // Force a user ID for testing if not authenticated
            $userId = auth()->check() ? auth()->id() : 1; // Use ID 1 as fallback (typically admin)

            // Create activity log entry directly
            ActivityLog::create([
                'user_id' => $userId,
                'action' => 'delete',
                'entity_type' => 'Item',
                'entity_id' => $itemId,
                'details' => "Deleted item: {$itemName}",
                'timestamp' => now(),
            ]);

            \Log::debug('Activity log created for deleted item: ' . $itemId);
        } catch (\Exception $e) {
            // Log the error but don't fail the request
            \Log::error('Failed to create activity log for deletion: ' . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Item deleted successfully'
        ]);
    }

    /**
     * Get low stock items
     */
    public function getLowStock()
    {
        $lowStockItems = Item::with('category')
            ->whereColumn('quantity_on_hand', '<=', 'reorder_level')
            ->where('reorder_level', '>', 0)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $lowStockItems
        ]);
    }

    /**
     * Bulk import items
     */
    public function bulkImport(Request $request)
    {
        // Log incoming data for debugging
        \Log::debug('Bulk Import Request Data', [
            'items_count' => count($request->items ?? []),
            'first_item' => $request->items[0] ?? null,
        ]);

        // Define validation rules for better readability
        $validationRules = [
            'items' => 'required|array',

            // Item identification
            'items.*.itemNo|items.*.item_no' => 'nullable|string|max:50',
            'items.*.itemName|items.*.item_name' => 'required|string|max:255',

            // Classification
            'items.*.category' => 'nullable|string',
            'items.*.category_id' => 'nullable|exists:categories,id|nullable',
            'items.*.description' => 'nullable|string',

            // Quantity related
            'items.*.quantityOnHand|items.*.quantity_on_hand' => 'nullable|integer|min:0',
            'items.*.unit' => 'nullable|string|max:50',

            // Reorder info
            'items.*.reorderLevel|items.*.reorder_level' => 'nullable|integer|min:0',
            'items.*.reorderQuantity|items.*.reorder_quantity' => 'nullable|integer|min:0',

            // Supplier info
            'items.*.supplier' => 'nullable|string|max:255',
            'items.*.lastOrderedDate|items.*.last_ordered_date' => 'nullable|date',

            // Location and notes
            'items.*.location' => 'nullable|string|max:255',
            'items.*.notes' => 'nullable|string',
        ];

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Use the ImportService to handle the bulk import
            $importService = app(ItemImportService::class);
            $importedItems = $importService->bulkImport($request->items);

            return response()->json([
                'status' => 'success',
                'message' => count($importedItems) . ' items imported successfully',
                'data' => $importedItems
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import items from Excel/CSV file
     */
    public function importFromFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,xlsx,xls',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Use the ImportService to handle the file import
            $importService = app(ItemImportService::class);
            $result = $importService->importFromFile($request->file('file'));

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error processing file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process CSV file and import items
     */
    private function processCSVFile($filePath)
    {
        $csv = array_map('str_getcsv', file($filePath));
        $headers = array_map('trim', $csv[0]);

        // Standard column mapping based on Excel columns A-L
        $columnMap = [
            0 => 'item_no',         // A = ITEM NO.
            1 => 'item_name',       // B = ITEM NAME
            2 => 'category',        // C = CATEGORY
            3 => 'description',     // D = DESCRIPTION
            4 => 'quantity_on_hand',// E = QUANTITY ON HAND
            5 => 'unit',            // F = UNIT
            6 => 'reorder_level',   // G = REORDER LEVEL
            7 => 'reorder_quantity',// H = REORDER QUANTITY
            8 => 'supplier',        // I = SUPPLIER
            9 => 'last_ordered_date',// J = LAST ORDERED DATE
            10 => 'location',       // K = LOCATION
            11 => 'notes'           // L = NOTES
        ];

        $importedItems = [];
        $useHeaderMap = true;

        // Check if headers are valid, otherwise use column positions
        if (count($headers) < 3 || !$this->areHeadersValid($headers)) {
            $useHeaderMap = false;
            \Log::info('CSV import using column positions instead of headers');
        }

        // Process each row
        for ($i = 1; $i < count($csv); $i++) {
            $row = array_map('trim', $csv[$i]);

            // Skip empty rows
            if ($this->isEmptyRow($row)) {
                continue;
            }

            $data = [];

            if ($useHeaderMap && count($headers) == count($row)) {
                // Use headers from the file
                $data = array_combine($headers, $row);
            } else {
                // Use column positions when headers aren't valid
                foreach ($columnMap as $colIndex => $fieldName) {
                    if (isset($row[$colIndex])) {
                        $data[$fieldName] = $row[$colIndex];
                    }
                }
            }

            // Map headers to database fields
            $itemData = $this->mapImportDataToItemFields($data);

            // Clean and standardize data
            $this->cleanImportData($itemData);

            // If item_no exists in imported data, preserve it
            if (!empty($itemData['item_no'])) {
                $itemData['preserve_item_no'] = true;
            }

            // Only import rows that have an item name
            if (!empty($itemData['item_name'])) {
                // Save to database
                $importedItems[] = $this->saveImportedItem($itemData);
            }
        }

        return $importedItems;
    }

    /**
     * Process Excel file and import items
     */
    private function processExcelFile($filePath)
    {
        // For this to work, you need to install:
        // composer require phpoffice/phpspreadsheet

        // Check if PhpSpreadsheet is available
        if (!class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
            // Fallback to CSV processing as a workaround
            \Log::warning('PhpSpreadsheet not available - attempting to process Excel as CSV');
            return $this->processCSVFile($filePath);
        }

        // If PhpSpreadsheet is available, use it directly
        $phpOfficeClass = '\PhpOffice\PhpSpreadsheet\IOFactory';
        $spreadsheet = $phpOfficeClass::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        // Get column count for better handling of input data
        $columnCount = 0;
        foreach ($rows as $row) {
            $columnCount = max($columnCount, count($row));
        }

        \Log::info('Excel file details', [
            'rows' => count($rows),
            'columns' => $columnCount,
            'first_row' => $rows[0] ?? []
        ]);

        // Standard column mapping based on Excel columns A-L
        $columnMap = [
            0 => 'item_no',         // A = ITEM NO.
            1 => 'item_name',       // B = ITEM NAME
            2 => 'category',        // C = CATEGORY
            3 => 'description',     // D = DESCRIPTION
            4 => 'quantity_on_hand',// E = QUANTITY ON HAND
            5 => 'unit',            // F = UNIT
            6 => 'reorder_level',   // G = REORDER LEVEL
            7 => 'reorder_quantity',// H = REORDER QUANTITY
            8 => 'supplier',        // I = SUPPLIER
            9 => 'last_ordered_date',// J = LAST ORDERED DATE
            10 => 'location',       // K = LOCATION
            11 => 'notes'           // L = NOTES
        ];

        // Special handling for 2-column data (quantity and unit only)
        if ($columnCount <= 2) {
            \Log::info('Detected simplified 2-column format (quantity/unit)');
            $columnMap = [
                0 => 'quantity_on_hand',  // First column is quantity
                1 => 'unit'               // Second column is unit
            ];
        }

        // Clean headers by trimming and handling special characters
        $headers = [];
        if (!empty($rows[0])) {
            $headers = array_map(function ($header) {
                // Convert to string, trim, remove BOM and other special chars
                $header = trim((string) $header);
                $header = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header);
                return $header;
            }, $rows[0]);

            \Log::info('Cleaned headers', ['headers' => $headers]);
        }

        $importedItems = [];
        $useHeaderMap = true;

        // Check if headers are valid, otherwise use column positions
        if (count($headers) < 2 || !$this->areHeadersValid($headers)) {
            $useHeaderMap = false;
            \Log::info('Excel import using column positions instead of headers');
        }

        // Process each row
        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];

            // Skip empty rows
            if ($this->isEmptyRow($row)) {
                continue;
            }

            $data = [];

            if ($useHeaderMap && count($headers) == count($row)) {
                // Use headers from the file
                $data = array_combine($headers, $row);
            } else {
                // Use column positions when headers aren't valid
                foreach ($columnMap as $colIndex => $fieldName) {
                    if (isset($row[$colIndex])) {
                        $data[$fieldName] = $row[$colIndex];
                    }
                }
            }

            // Map headers to database fields
            $itemData = $this->mapImportDataToItemFields($data);

            // Clean and standardize data
            $this->cleanImportData($itemData);

            // If item_no exists in imported data, preserve it
            if (!empty($itemData['item_no'])) {
                $itemData['preserve_item_no'] = true;
            }

            // Only import rows that have an item name
            if (!empty($itemData['item_name'])) {
                // Save to database
                $importedItems[] = $this->saveImportedItem($itemData);
            }
        }

        return $importedItems;
    }

    /**
     * Check if a row is completely empty
     */
    private function isEmptyRow($row)
    {
        foreach ($row as $value) {
            if (!empty($value) && $value !== '' && $value !== null) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if headers are valid for mapping
     */
    private function areHeadersValid($headers)
    {
        // Log the headers for debugging
        \Log::info('Excel/CSV import headers', [
            'headers' => $headers
        ]);

        // Look for more header patterns including quantity and unit
        $namePatterns = [
            'item',
            'name',
            'product',
            'description',
            'quantity',
            'qty',
            'unit',
            'stock'
        ];

        $found = false;
        foreach ($headers as $header) {
            // Normalize header: convert to lowercase and trim
            $header = strtolower(trim($header));

            // Debug each header being checked
            \Log::debug('Checking header: ' . $header);

            foreach ($namePatterns as $pattern) {
                if (strpos($header, $pattern) !== false) {
                    \Log::debug('Found valid header pattern: ' . $pattern . ' in ' . $header);
                    $found = true;
                    break 2;
                }
            }
        }

        \Log::info('Headers valid: ' . ($found ? 'Yes' : 'No'));
        return $found;
    }

    /**
     * Map import data headers to database fields
     */
    private function mapImportDataToItemFields($data)
    {
        // Flag this data as coming from a file import
        $data['__isBulkImport'] = true;

        // Initialize with empty item_no to ensure it exists in the result
        $itemData = [
            'item_no' => null  // Default to null to avoid undefined array key errors
        ];

        // Define mappings by field type for better organization
        $itemNoMappings = [
            'Item No.',
            'Item No',
            'itemNo',
            'ITEM NO',
            'ITEM NO.',
            '#',
            'SKU',
            'Product ID'
        ];

        $itemNameMappings = [
            'Item Name',
            'itemName',
            'ITEM NAME',
            'Name',
            'Product',
            'Product Name',
            'Title'
        ];

        $categoryMappings = [
            'Category',
            'CATEGORY',
            'Cat',
            'Type',
            'Group'
        ];

        $descriptionMappings = [
            'Description',
            'DESCRIPTION',
            'DISCRIPTION',
            'Desc',
            'Details'
        ];

        $quantityMappings = [
            'Quantity on Hand',
            'quantityOnHand',
            'QUANTITY ON HAND',
            'QUANTITY_ON_HAND',
            'quantity_on_hand',
            'Quantity',
            'QUANTITY',
            'QOH',
            'Qty',
            'QTY',
            'Stock',
            'STOCK',
            'Inventory',
            'INVENTORY',
            'On Hand',
            'ON HAND',
            'Count',
            'Amount'
        ];

        $unitMappings = [
            'Unit',
            'UNIT',
            'UOM',
            'UnitOfMeasure',
            'Unit Of Measure',
            'Unit of Measure',
            'UNIT OF MEASURE',
            'Measure',
            'MEASURE',
            'Units',
            'UNITS',
            'Unit Type',
            'UNIT TYPE',
            'Type',
            'TYPE'
        ];

        $reorderLevelMappings = [
            'Reorder Level',
            'reorderLevel',
            'REORDER LEVEL',
            'Min Stock',
            'Min',
            'Minimum',
            'Low Stock'
        ];

        $reorderQtyMappings = [
            'Reorder Quantity',
            'reorderQuantity',
            'REORDER QUANTITY',
            'Order Qty',
            'Order Size',
            'Batch Size'
        ];

        $supplierMappings = [
            'Supplier',
            'SUPPLIER',
            'Vendor',
            'Manufacturer',
            'Provider'
        ];

        $dateMappings = [
            'Last Ordered Date',
            'lastOrderedDate',
            'LAST ORDERED DATE',
            'Last Order',
            'Purchase Date',
            'Date'
        ];

        $locationMappings = [
            'Location',
            'LOCATION',
            'Storage',
            'Warehouse',
            'Shelf',
            'Area'
        ];

        $notesMappings = [
            'Notes',
            'NOTES',
            'Comments',
            'Remarks',
            'Info',
            'Additional Info'
        ];

        // Build mapping array
        $mapping = [];

        // Helper function to build mappings
        $addMappings = function ($sourceArray, $targetField) use (&$mapping) {
            foreach ($sourceArray as $source) {
                $mapping[$source] = $targetField;
            }
        };

        // Apply mappings
        $addMappings($itemNoMappings, 'item_no');
        $addMappings($itemNameMappings, 'item_name');
        $addMappings($categoryMappings, 'category');
        $addMappings($descriptionMappings, 'description');
        $addMappings($quantityMappings, 'quantity_on_hand');
        $addMappings($unitMappings, 'unit');
        $addMappings($reorderLevelMappings, 'reorder_level');
        $addMappings($reorderQtyMappings, 'reorder_quantity');
        $addMappings($supplierMappings, 'supplier');
        $addMappings($dateMappings, 'last_ordered_date');
        $addMappings($locationMappings, 'location');
        $addMappings($notesMappings, 'notes');

        // Define standard field names
        $standardFields = [
            'item_no',
            'item_name',
            'category',
            'description',
            'quantity_on_hand',
            'unit',
            'reorder_level',
            'reorder_quantity',
            'supplier',
            'last_ordered_date',
            'location',
            'notes'
        ];

        foreach ($data as $key => $value) {
            // If the key is already in our standardized format (from column mapping),
            // use it directly
            if (in_array($key, $standardFields)) {
                $itemData[$key] = $value;
            }
            // Otherwise check our header mapping
            else if (isset($mapping[$key])) {
                $dbField = $mapping[$key];
                $itemData[$dbField] = $value;
            }
        }

        // Handle category mapping to category_id
        if (isset($itemData['category']) && !empty($itemData['category'])) {
            $category = Category::where('name', $itemData['category'])->first();
            if ($category) {
                $itemData['category_id'] = $category->id;
            } else {
                // Create new category if it doesn't exist
                $newCategory = Category::create([
                    'name' => $itemData['category'],
                    'slug' => \Illuminate\Support\Str::slug($itemData['category']),
                    'is_active' => true
                ]);
                $itemData['category_id'] = $newCategory->id;
            }
            unset($itemData['category']);
        }

        return $itemData;
    }

    /**
     * Save imported item data
     */
    private function saveImportedItem($itemData)
    {
        // Ensure required field is present
        if (empty($itemData['item_name'])) {
            $itemData['item_name'] = 'Unnamed Item';
        }

        // Ensure item_no is always set in the array, even if null
        if (!isset($itemData['item_no'])) {
            $itemData['item_no'] = null;
        }

        // Check if we should preserve an existing item_no
        $preserveItemNo = !empty($itemData['preserve_item_no']) && !empty($itemData['item_no']);

        // If item_no is empty or just whitespace, explicitly set to NULL
        if (isset($itemData['item_no']) && is_string($itemData['item_no']) && trim($itemData['item_no']) === '') {
            $itemData['item_no'] = null;
        }

        // Check if item exists (only if item_no is not null)
        $existingItem = null;
        if (!empty($itemData['item_no'])) {
            $existingItem = Item::where('item_no', $itemData['item_no'])->first();
        }

        if ($existingItem) {
            $existingItem->update($itemData);
            return $existingItem;
        } else {
            try {
                // Remove any temporary flags from the data before creating
                unset($itemData['__isBulkImport']);
                unset($itemData['__generateItemNo']);
                unset($itemData['preserve_item_no']);

                return Item::create($itemData);
            } catch (\Exception $e) {
                // Log the error with the data that caused it
                \Log::error("Error creating item: " . $e->getMessage(), ['data' => $itemData]);
                throw $e;
            }
        }
    }

    /**
     * Normalize item data by converting camelCase to snake_case
     * and handling category mapping
     */
    /**
     * Generate a unique item number
     * 
     * @return string
     */
    private function generateItemNo()
    {
        // Use the model's static method
        return Item::generateItemNo();
    }

    /**
     * Clean and standardize imported data
     */
    private function cleanImportData(&$itemData)
    {
        // Clean item_name
        if (isset($itemData['item_name'])) {
            $itemData['item_name'] = trim((string) $itemData['item_name']);
        }

        // Clean and standardize numeric fields
        $numericFields = ['quantity_on_hand', 'reorder_level', 'reorder_quantity'];
        foreach ($numericFields as $field) {
            if (isset($itemData[$field])) {
                // Log the original value for debugging
                \Log::debug("Converting $field", ['original' => $itemData[$field]]);

                // Extract numbers from any format
                if (is_string($itemData[$field])) {
                    // First, try to convert directly if it's a valid numeric string
                    if (is_numeric($itemData[$field])) {
                        $itemData[$field] = (int) $itemData[$field];
                    } else {
                        // Remove any non-numeric characters except decimal point
                        $value = preg_replace('/[^0-9.]/', '', (string) $itemData[$field]);
                        $itemData[$field] = $value === '' ? 0 : (int) $value;
                    }
                } else if (is_numeric($itemData[$field])) {
                    // Ensure value is an integer
                    $itemData[$field] = (int) $itemData[$field];
                } else {
                    // Default to 0 for non-numeric values
                    \Log::warning("Non-numeric value found for $field", ['value' => $itemData[$field]]);
                    $itemData[$field] = 0;
                }

                // Log the converted value
                \Log::debug("$field converted", ['result' => $itemData[$field]]);
            }
        }

        // Handle item_no - ensure it's a string or explicitly NULL
        if (isset($itemData['item_no'])) {
            $itemData['item_no'] = trim((string) $itemData['item_no']);
            // If it's just whitespace or empty, set to NULL
            if ($itemData['item_no'] === '') {
                $itemData['item_no'] = null;
            }
        }

        // Handle unit
        if (isset($itemData['unit'])) {
            $unit = strtolower(trim((string) $itemData['unit']));

            // Standardize common units
            if (in_array($unit, ['pc', 'pcs', 'piece', 'pieces', 'each', 'ea'])) {
                $itemData['unit'] = 'Piece';
            } else if (in_array($unit, ['bx', 'box', 'boxes'])) {
                $itemData['unit'] = 'Box';
            } else if (in_array($unit, ['pk', 'pack', 'packs'])) {
                $itemData['unit'] = 'Pack';
            } else if (in_array($unit, ['set', 'sets'])) {
                $itemData['unit'] = 'Set';
            } else if (in_array($unit, ['bundle', 'bundles'])) {
                $itemData['unit'] = 'Bundle';
            } else if (in_array($unit, ['carton', 'cartons', 'ctn'])) {
                $itemData['unit'] = 'Carton';
            } else if (empty($unit)) {
                $itemData['unit'] = 'Piece'; // Default
            } else {
                // Capitalize the first letter for consistency
                $itemData['unit'] = ucfirst($unit);
            }
        }

        // Handle date format
        if (isset($itemData['last_ordered_date']) && !empty($itemData['last_ordered_date'])) {
            $date = $itemData['last_ordered_date'];

            // If it's already a date object, convert to Y-m-d string
            if ($date instanceof \DateTime) {
                $itemData['last_ordered_date'] = $date->format('Y-m-d');
            }
            // If it's a string, try to convert to date
            else if (is_string($date)) {
                try {
                    $dateObj = new \DateTime($date);
                    $itemData['last_ordered_date'] = $dateObj->format('Y-m-d');
                } catch (\Exception $e) {
                    // If parsing fails, leave as is - validation will catch it
                }
            }
        }
    }

    /**
     * Normalize item data by converting camelCase to snake_case and setting defaults
     *
     * @param array $data Input data array with mixed case keys
     * @return array Normalized data with snake_case keys and proper defaults
     */
    private function normalizeItemData($data)
    {
        $normalized = [];

        // Define field mappings from camelCase to snake_case
        $mapping = [
            // Item identification
            'itemNo' => 'item_no',
            'itemName' => 'item_name',

            // Classification
            'category' => 'category',
            'description' => 'description',

            // Quantity and units
            'quantityOnHand' => 'quantity_on_hand',
            'unit' => 'unit',

            // Reorder information
            'reorderLevel' => 'reorder_level',
            'reorderQuantity' => 'reorder_quantity',

            // Additional information
            'supplier' => 'supplier',
            'lastOrderedDate' => 'last_ordered_date',
            'location' => 'location',
            'notes' => 'notes',
        ];

        // Map camelCase to snake_case
        foreach ($data as $key => $value) {
            if (isset($mapping[$key])) {
                $normalized[$mapping[$key]] = $value;
            } else {
                $normalized[$key] = $value;
            }
        }

        // We'll let the model handle auto-generating item_no if it's empty

        // Apply default values
        $this->applyDefaultValues($normalized);

        return $normalized;
    }

    /**
     * Apply default values to normalized data
     *
     * @param array &$normalized Data array to modify with defaults
     */
    private function applyDefaultValues(&$normalized)
    {
        // Ensure item_name is never null
        if (empty($normalized['item_name'])) {
            $normalized['item_name'] = 'Unnamed Item';
        }

        // Set default values for missing fields
        if (!isset($normalized['unit'])) {
            $normalized['unit'] = 'Piece';
        }

        if (!isset($normalized['quantity_on_hand'])) {
            $normalized['quantity_on_hand'] = 0;
        }

        // Handle category conversion
        $this->handleCategoryConversion($normalized);
    }

    /**
     * Handle category name to category_id conversion
     *
     * @param array &$normalized Data array to process
     */
    private function handleCategoryConversion(&$normalized)
    {
        // Convert category name to category_id if needed
        if (isset($normalized['category']) && !empty($normalized['category']) && !isset($normalized['category_id'])) {
            $category = Category::where('name', $normalized['category'])->first();

            if ($category) {
                // Use existing category
                $normalized['category_id'] = $category->id;
            } else {
                // Create a new category
                $newCategory = Category::create([
                    'name' => $normalized['category'],
                    'slug' => \Illuminate\Support\Str::slug($normalized['category']),
                    'is_active' => true
                ]);
                $normalized['category_id'] = $newCategory->id;
            }

            // Remove the category field as we're using category_id
            unset($normalized['category']);
        }

        // If category_id is explicitly set to null or 0, keep it null
        if (
            array_key_exists('category_id', $normalized) &&
            ($normalized['category_id'] === null || $normalized['category_id'] === 0)
        ) {
            $normalized['category_id'] = null;
        }
    }

    /**
     * Adjust stock quantity for an item
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function adjustStock(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'adjustment_type' => 'required|string|in:restock,adjustment,correction,loss',
            'quantity_change' => 'required|integer',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $item = Item::findOrFail($id);
        $oldQuantity = $item->quantity_on_hand;
        $quantityChange = $request->quantity_change;
        $newQuantity = $oldQuantity + $quantityChange;

        // Prevent negative quantities
        if ($newQuantity < 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot adjust quantity below zero. Current quantity: ' . $oldQuantity . ', Adjustment: ' . $quantityChange
            ], 400);
        }

        // Update the item quantity
        $item->update(['quantity_on_hand' => $newQuantity]);

        // Log the stock adjustment
        try {
            $this->logStockAdjustment(
                $item->id,
                $item->item_name,
                $oldQuantity,
                $newQuantity,
                $request->adjustment_type,
                $request->notes ?? ''
            );
        } catch (\Exception $e) {
            \Log::error('Failed to create stock adjustment activity log: ' . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Stock adjusted successfully',
            'data' => [
                'item_id' => $item->id,
                'item_name' => $item->item_name,
                'old_quantity' => $oldQuantity,
                'new_quantity' => $newQuantity,
                'quantity_change' => $quantityChange,
                'adjustment_type' => $request->adjustment_type
            ]
        ]);
    }
}
