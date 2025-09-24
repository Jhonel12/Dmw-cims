<?php

namespace App\Services\Import;

use App\Models\Item;
use App\Models\Category;
use App\Http\Controllers\ActivityLogController;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ItemImportService
{
    /**
     * Import items from Excel/CSV file
     */
    public function importFromFile(UploadedFile $file)
    {
        $fileName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();

        // Store the file temporarily
        $path = $file->storeAs('temp', $fileName);
        $fullPath = storage_path('app/' . $path);

        try {
            $importedItems = [];

            // Process based on file type
            if ($extension === 'csv') {
                $importedItems = $this->processCSVFile($fullPath);
            } else {
                $importedItems = $this->processExcelFile($fullPath);
            }

            // Log the import activity
            $this->logImportActivity($importedItems, $fileName, 'file');

            // Clean up
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return [
                'status' => 'success',
                'message' => count($importedItems) . ' items imported successfully (with automatic column mapping)',
                'data' => $importedItems,
                'meta' => [
                    'total_imported' => count($importedItems),
                    'column_mapping_used' => true
                ]
            ];

        } catch (\Exception $e) {
            // Clean up on error too
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            throw $e;
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
            Log::info('CSV import using column positions instead of headers');
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

            // Ensure item_no is always set in the array, even if null
            if (!isset($itemData['item_no'])) {
                $itemData['item_no'] = null;
            }

            // If item_no exists in imported data, preserve it
            if (isset($itemData['item_no']) && !empty($itemData['item_no'])) {
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

        // Check if PhpSpreadsheet is available
        if (class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
            // Use PhpSpreadsheet if available
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
        } else {
            // Fallback to CSV conversion if PhpSpreadsheet is not available
            Log::info('PhpSpreadsheet not available, using fallback CSV conversion for Excel file');

            // For now, we'll just treat it as a CSV with comma separator
            // This is a simplified fallback and won't handle all Excel files correctly
            $rows = [];
            $handle = fopen($filePath, 'r');
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                $rows[] = $data;
            }
            fclose($handle);

            // Add instructions for proper setup
            Log::warning('For better Excel file handling, please install PhpSpreadsheet: composer require phpoffice/phpspreadsheet');
        }

        $headers = array_map('trim', $rows[0]);
        $importedItems = [];
        $useHeaderMap = true;

        // Check if this is a simple format with just 2 columns (likely quantity and unit)
        $columnCount = count($headers);
        $isSimpleFormat = $columnCount <= 2;
        if ($isSimpleFormat) {
            Log::info('Detected simple 2-column format for import', ['headers' => $headers]);
        }

        // Check if headers are valid, otherwise use column positions
        if (($columnCount < 3 && !$isSimpleFormat) || !$this->areHeadersValid($headers)) {
            $useHeaderMap = false;
            Log::info('Excel import using column positions instead of headers');
        }

        // Process each row
        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];

            // Skip empty rows
            if ($this->isEmptyRow($row)) {
                continue;
            }

            $data = [];

            // Special case for the simplified 2-column format (QUANTITY ON HAND, UNIT)
            if ($isSimpleFormat && !empty($row[0])) {
                // For 2-column formats, we'll handle them directly
                $quantity = $row[0];
                $unit = isset($row[1]) ? $row[1] : 'Piece';

                // Create a minimal dataset with the essential fields
                $data = [
                    'quantity_on_hand' => $quantity,
                    'unit' => $unit,
                    'item_name' => ucfirst(strtolower($unit)) . ' Item'  // Generate a name based on the unit
                ];

                Log::info('Processing 2-column data', ['quantity' => $quantity, 'unit' => $unit]);
            }
            // Normal processing for standard data formats
            else if ($useHeaderMap && count($headers) == count($row)) {
                // Use headers from the file
                $data = array_combine($headers, $row);
                Log::debug('Row data with headers', ['data' => $data]);
            } else {
                // Use column positions when headers aren't valid
                foreach ($columnMap as $colIndex => $fieldName) {
                    if (isset($row[$colIndex])) {
                        $data[$fieldName] = $row[$colIndex];
                    }
                }
                Log::debug('Row data with column mapping', ['data' => $data]);
            }

            // Map headers to database fields
            $itemData = $this->mapImportDataToItemFields($data);

            // Clean and standardize data
            $this->cleanImportData($itemData);

            // Ensure item_no is always set in the array, even if null
            if (!isset($itemData['item_no'])) {
                $itemData['item_no'] = null;
            }

            // If item_no exists in imported data, preserve it
            if (isset($itemData['item_no']) && !empty($itemData['item_no'])) {
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
        // Log the headers we're validating
        Log::debug('Validating headers', ['headers' => $headers]);

        // Special case: If we have exactly 2 columns, check if they match quantity and unit patterns
        if (count($headers) == 2) {
            $quantityPatterns = ['quantity', 'qty', 'qoh', 'stock', 'on hand', 'inventory'];
            $unitPatterns = ['unit', 'uom', 'measure', 'packaging'];

            $quantityFound = false;
            $unitFound = false;

            // Check first column (typically quantity)
            $header1 = strtolower($headers[0]);
            foreach ($quantityPatterns as $pattern) {
                if (strpos($header1, $pattern) !== false) {
                    $quantityFound = true;
                    break;
                }
            }

            // Check second column (typically unit)
            if (isset($headers[1])) {
                $header2 = strtolower($headers[1]);
                foreach ($unitPatterns as $pattern) {
                    if (strpos($header2, $pattern) !== false) {
                        $unitFound = true;
                        break;
                    }
                }
            }

            // If both quantity and unit headers are found, this is a valid 2-column format
            if ($quantityFound && $unitFound) {
                Log::info('Detected valid 2-column format', ['quantity' => $headers[0], 'unit' => $headers[1]]);
                return true;
            }
        }

        // Regular case: Check if any of the headers contain item name or similar
        $namePatterns = ['item', 'name', 'product', 'description'];
        $found = false;
        foreach ($headers as $header) {
            $header = strtolower($header);
            foreach ($namePatterns as $pattern) {
                if (strpos($header, $pattern) !== false) {
                    $found = true;
                    Log::debug('Found valid header', ['header' => $header, 'pattern' => $pattern]);
                    break 2;
                }
            }
        }

        if (!$found) {
            Log::warning('No valid headers found in import file');
        }

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

        $mapping = [
            'Item No.' => 'item_no',
            'Item No' => 'item_no',
            'itemNo' => 'item_no',
            'ITEM NO' => 'item_no',
            'ITEM NO.' => 'item_no',
            '#' => 'item_no',
            'SKU' => 'item_no',
            'Product ID' => 'item_no',

            'Item Name' => 'item_name',
            'itemName' => 'item_name',
            'ITEM NAME' => 'item_name',
            'Name' => 'item_name',
            'Product' => 'item_name',
            'Product Name' => 'item_name',
            'Title' => 'item_name',

            'Category' => 'category',
            'CATEGORY' => 'category',
            'Cat' => 'category',
            'Type' => 'category',
            'Group' => 'category',

            'Description' => 'description',
            'DESCRIPTION' => 'description',
            'DISCRIPTION' => 'description',
            'Desc' => 'description',
            'Details' => 'description',

            'Quantity on Hand' => 'quantity_on_hand',
            'quantityOnHand' => 'quantity_on_hand',
            'QUANTITY ON HAND' => 'quantity_on_hand',
            'Quantity' => 'quantity_on_hand',
            'QOH' => 'quantity_on_hand',
            'Qty' => 'quantity_on_hand',
            'Stock' => 'quantity_on_hand',
            'Inventory' => 'quantity_on_hand',
            'Count' => 'quantity_on_hand',
            'Amount' => 'quantity_on_hand',
            'On Hand' => 'quantity_on_hand',
            'In Stock' => 'quantity_on_hand',
            'Available' => 'quantity_on_hand',

            'Unit' => 'unit',
            'UNIT' => 'unit',
            'U/M' => 'unit',
            'UNIT OF MEASURE' => 'unit',
            'Units' => 'unit',
            'Package' => 'unit',
            'Packaging' => 'unit',
            'Size' => 'unit',
            'UOM' => 'unit',
            'Measure' => 'unit',
            'Unit of Measure' => 'unit',

            'Reorder Level' => 'reorder_level',
            'reorderLevel' => 'reorder_level',
            'REORDER LEVEL' => 'reorder_level',
            'Min Stock' => 'reorder_level',
            'Min' => 'reorder_level',
            'Minimum' => 'reorder_level',
            'Low Stock' => 'reorder_level',

            'Reorder Quantity' => 'reorder_quantity',
            'reorderQuantity' => 'reorder_quantity',
            'REORDER QUANTITY' => 'reorder_quantity',
            'Order Qty' => 'reorder_quantity',
            'Order Size' => 'reorder_quantity',
            'Batch Size' => 'reorder_quantity',

            'Supplier' => 'supplier',
            'SUPPLIER' => 'supplier',
            'Vendor' => 'supplier',
            'Manufacturer' => 'supplier',
            'Provider' => 'supplier',

            'Last Ordered Date' => 'last_ordered_date',
            'lastOrderedDate' => 'last_ordered_date',
            'LAST ORDERED DATE' => 'last_ordered_date',
            'Last Order' => 'last_ordered_date',
            'Purchase Date' => 'last_ordered_date',
            'Date' => 'last_ordered_date',

            'Location' => 'location',
            'LOCATION' => 'location',
            'Storage' => 'location',
            'Warehouse' => 'location',
            'Shelf' => 'location',
            'Area' => 'location',

            'Notes' => 'notes',
            'NOTES' => 'notes',
            'Comments' => 'notes',
            'Remarks' => 'notes',
            'Info' => 'notes',
            'Additional Info' => 'notes',
        ];

        foreach ($data as $key => $value) {
            // If the key is already in our standardized format (from column mapping),
            // use it directly
            if (
                in_array($key, [
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
                ])
            ) {
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
                    'slug' => Str::slug($itemData['category']),
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
                Log::error("Error creating item: " . $e->getMessage(), ['data' => $itemData]);
                throw $e;
            }
        }
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
                // Log raw value for debugging
                $rawValue = $itemData[$field];
                Log::debug("Processing numeric field", ['field' => $field, 'raw_value' => $rawValue]);

                try {
                    // Extract numbers from any format
                    if (is_string($itemData[$field])) {
                        // Remove any non-numeric characters except decimal point
                        $value = preg_replace('/[^0-9.]/', '', (string) $itemData[$field]);

                        // Handle empty string case
                        if ($value === '') {
                            $itemData[$field] = 0;
                        } else {
                            // Try to convert to float first (in case it has decimals)
                            $floatValue = (float) $value;

                            // If it's a whole number, store as integer
                            if (floor($floatValue) == $floatValue) {
                                $itemData[$field] = (int) $floatValue;
                            } else {
                                // For values with decimals, keep as is (float)
                                $itemData[$field] = $floatValue;
                            }
                        }
                    } else if (is_numeric($itemData[$field])) {
                        // Already numeric, normalize to int if it's a whole number
                        $floatValue = (float) $itemData[$field];
                        if (floor($floatValue) == $floatValue) {
                            $itemData[$field] = (int) $floatValue;
                        } else {
                            $itemData[$field] = $floatValue;
                        }
                    } else {
                        // Non-string, non-numeric value - default to 0
                        $itemData[$field] = 0;
                    }
                } catch (\Exception $e) {
                    // If anything goes wrong, log it and set a default value
                    Log::warning("Error processing numeric field: " . $e->getMessage(), [
                        'field' => $field,
                        'value' => $itemData[$field]
                    ]);
                    $itemData[$field] = 0;
                }

                // Log the processed value
                Log::debug("Processed numeric field", ['field' => $field, 'processed_value' => $itemData[$field]]);
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
            $originalUnit = $itemData['unit'];
            $unit = strtolower(trim((string) $itemData['unit']));

            Log::debug('Processing unit value', ['original' => $originalUnit, 'normalized' => $unit]);

            // Standardize common units
            if (in_array($unit, ['pc', 'pcs', 'piece', 'pieces', 'each', 'ea', 'unit', 'units'])) {
                $itemData['unit'] = 'Piece';
            } else if (in_array($unit, ['bx', 'box', 'boxes'])) {
                $itemData['unit'] = 'Box';
            } else if (in_array($unit, ['pk', 'pack', 'packs', 'package', 'packages'])) {
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
     * Bulk import items from an array
     */
    public function bulkImport(array $items)
    {
        $importedItems = [];

        foreach ($items as $itemData) {
            // Skip entries with no item_name
            if (empty($itemData['item_name']) && empty($itemData['itemName'])) {
                continue;
            }

            // Flag this as part of a bulk import
            $itemData['__isBulkImport'] = true;

            // Decide whether to generate an item_no if missing
            $itemData['__generateItemNo'] = empty($itemData['item_no']) && empty($itemData['itemNo']);

            // Normalize the data
            $normalizedData = $this->normalizeItemData($itemData);

            // Double-check that required fields are present
            if (empty($normalizedData['item_name'])) {
                continue; // Skip this item if name is missing
            }

            // Check if item_no already exists (only if item_no is set)
            $existingItem = null;
            if (isset($normalizedData['item_no']) && !empty($normalizedData['item_no'])) {
                $existingItem = Item::where('item_no', $normalizedData['item_no'])->first();
            }

            if ($existingItem) {
                // Update existing item
                $existingItem->update($normalizedData);
                $importedItems[] = $existingItem;
            } else {
                // Create new item
                $newItem = Item::create($normalizedData);
                $importedItems[] = $newItem;
            }
        }

        // Log the bulk import activity
        $this->logImportActivity($importedItems, 'Bulk Import', 'bulk');

        return $importedItems;
    }

    /**
     * Log import activity for admin tracking
     */
    private function logImportActivity($importedItems, $source, $type)
    {
        try {
            $userId = auth()->id();
            if (!$userId) {
                return; // Skip logging if no authenticated user
            }

            $itemCount = count($importedItems);
            $itemNames = collect($importedItems)->pluck('item_name')->take(5)->toArray();
            
            $details = sprintf(
                'Imported %d item(s) from %s. Items: %s%s',
                $itemCount,
                $source,
                implode(', ', $itemNames),
                $itemCount > 5 ? '...' : ''
            );

            ActivityLogController::logActivity(
                $userId,
                'bulk_import',
                'items',
                0, // No specific entity ID for bulk operations
                $details
            );
        } catch (\Exception $e) {
            Log::error('Failed to log import activity: ' . $e->getMessage());
        }
    }

    /**
     * Normalize item data by converting camelCase to snake_case
     */
    private function normalizeItemData($data)
    {
        $normalized = [];
        $mapping = [
            'itemNo' => 'item_no',
            'itemName' => 'item_name',
            'category' => 'category',
            'description' => 'description',
            'quantityOnHand' => 'quantity_on_hand',
            'unit' => 'unit',
            'reorderLevel' => 'reorder_level',
            'reorderQuantity' => 'reorder_quantity',
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

        // Handle category name to category_id conversion
        if (isset($normalized['category']) && !empty($normalized['category']) && !isset($normalized['category_id'])) {
            $category = Category::where('name', $normalized['category'])->first();
            if ($category) {
                $normalized['category_id'] = $category->id;
            } else {
                // Create a new category if it doesn't exist
                $newCategory = Category::create([
                    'name' => $normalized['category'],
                    'slug' => Str::slug($normalized['category']),
                    'is_active' => true
                ]);
                $normalized['category_id'] = $newCategory->id;
            }
            unset($normalized['category']);
        }

        // If category_id is explicitly set to null or 0, keep it null
        if (array_key_exists('category_id', $normalized) && ($normalized['category_id'] === null || $normalized['category_id'] === 0)) {
            $normalized['category_id'] = null;
        }

        return $normalized;
    }
}
