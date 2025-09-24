<?php

namespace App\Http\Controllers;

use App\Services\Import\ItemImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ImportController extends Controller
{
    protected $importService;

    /**
     * Create a new controller instance.
     */
    public function __construct(ItemImportService $importService)
    {
        $this->importService = $importService;
    }

    /**
     * Import items from an Excel/CSV file
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function importItems(Request $request)
    {
        // Validate request
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:csv,xlsx,xls|max:10240', // 10MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid file upload',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');

            // Process the import using our service
            $result = $this->importService->importFromFile($file);

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import items from JSON data
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function importJson(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'items' => 'required|array',
                'items.*.item_name' => 'required|string|max:255',
                'items.*.item_no' => 'nullable|string|max:100',
                'items.*.category' => 'nullable|string|max:100',
                'items.*.description' => 'nullable|string',
                'items.*.quantity_on_hand' => 'nullable|numeric|min:0',
                'items.*.unit' => 'nullable|string|max:50',
                'items.*.reorder_level' => 'nullable|numeric|min:0',
                'items.*.reorder_quantity' => 'nullable|numeric|min:0',
                'items.*.supplier' => 'nullable|string|max:255',
                'items.*.last_ordered_date' => 'nullable|date',
                'items.*.location' => 'nullable|string|max:255',
                'items.*.notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $items = $request->input('items');

            // Use our import service to process the items
            $importedItems = $this->importService->bulkImport($items);

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
}
