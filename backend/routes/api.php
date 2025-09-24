<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\DamageItemsController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NotificationController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/permissions', [AuthController::class, 'permissions']);
    });
});

// Category API routes
Route::middleware('auth:sanctum')->prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/all', [CategoryController::class, 'listAll']);
    Route::get('/tree', [CategoryController::class, 'getTree']);
    Route::post('/bulk-action', [CategoryController::class, 'bulkAction']);
    Route::get('/{id}/path', [CategoryController::class, 'getCategoryPath']);
    Route::post('/{id}/move', [CategoryController::class, 'moveCategory']);
    Route::get('/{id}', [CategoryController::class, 'show']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::put('/{id}', [CategoryController::class, 'update']);
    Route::delete('/{id}', [CategoryController::class, 'destroy']);
});


Route::get('/categories-for-dropdown', [CategoryController::class, 'getForDropdown']);
Route::get('/active-categories', [CategoryController::class, 'getActiveCategories']);
// Keep this public for the dashboard
Route::get('/inventory-stats', [ItemController::class, 'getInventoryStats']); // Direct test endpoint

// Export route - publicly accessible
Route::get('/items/export', [ExportController::class, 'exportItems']);

// Import Routes
Route::prefix('imports')->group(function () {
    Route::post('/items', [ImportController::class, 'importJson']);
    Route::post('/items-file', [ImportController::class, 'importItems']);
});

Route::middleware('auth:sanctum')->prefix('items')->group(function () {
    Route::get('/', [ItemController::class, 'index']);
    Route::get('/stats', [ItemController::class, 'getInventoryStats']);  // Add inventory statistics endpoint
    Route::get('/test-low-stock', [ItemController::class, 'testLowStock']);  // Test low stock filter
    Route::get('/low-stock', [ItemController::class, 'getLowStock']);
    Route::post('/bulk-import', [ItemController::class, 'bulkImport']);  // Keep for backward compatibility
    Route::post('/import-file', [ItemController::class, 'importFromFile']); // Keep for backward compatibility
    Route::get('/{id}', [ItemController::class, 'show']);
    Route::post('/', [ItemController::class, 'store']);
    Route::put('/{id}', [ItemController::class, 'update']);
    Route::post('/{id}/adjust-stock', [ItemController::class, 'adjustStock']); // Stock adjustment endpoint
    Route::delete('/{id}', [ItemController::class, 'destroy']);
});

// Division API routes
Route::middleware('auth:sanctum')->prefix('divisions')->group(function () {
    Route::get('/', [DivisionController::class, 'index']);
    Route::get('/all', [DivisionController::class, 'listAll']);
    Route::get('/active', [DivisionController::class, 'getActiveDivisions']);
    Route::get('/dropdown', [DivisionController::class, 'getForDropdown']);
    Route::get('/search', [DivisionController::class, 'search']);
    Route::get('/with-supplies-count', [DivisionController::class, 'getWithSuppliesCount']);
    Route::get('/statistics', [DivisionController::class, 'getStatistics']);
    Route::post('/bulk-action', [DivisionController::class, 'bulkAction']);
    Route::get('/{id}', [DivisionController::class, 'show']);
    Route::get('/{id}/supplies', [DivisionController::class, 'getSupplies']); // GET /api/divisions/{id}/supplies
    Route::post('/', [DivisionController::class, 'store']);
    Route::put('/{id}', [DivisionController::class, 'update']);
    Route::delete('/{id}', [DivisionController::class, 'destroy']);
});

// User API routes
Route::middleware('auth:sanctum')->prefix('users')->group(function () {
    // Basic CRUD
    Route::get('/', [UserController::class, 'index']);                    // GET /api/users
    Route::post('/', [UserController::class, 'store']);                   // POST /api/users
    Route::get('/{id}', [UserController::class, 'show']);                 // GET /api/users/{id}
    Route::put('/{id}', [UserController::class, 'update']);               // PUT /api/users/{id}
    Route::delete('/{id}', [UserController::class, 'destroy']);           // DELETE /api/users/{id}

    // Additional Endpoints
    Route::get('/division/{divisionId}', [UserController::class, 'getUsersByDivision']); // GET /api/users/division/{divisionId}
    Route::get('/role/{role}', [UserController::class, 'getUsersByRole']);               // GET /api/users/role/{role}
    Route::get('/evaluators', [UserController::class, 'getEvaluators']);                 // GET /api/users/evaluators
    Route::get('/search', [UserController::class, 'search']);                            // GET /api/users/search?query=...&role=...&division_id=...
    Route::get('/statistics', [UserController::class, 'getStatistics']);                 // GET /api/users/statistics
    Route::post('/bulk-action', [UserController::class, 'bulkAction']);                  // POST /api/users/bulk-action
    Route::post('/{id}/change-password', [UserController::class, 'changePassword']);     // POST /api/users/{id}/change-password
    Route::post('/{id}/toggle-focal-person', [UserController::class, 'toggleFocalPerson']); // POST /api/users/{id}/toggle-focal-person
    Route::post('/{id}/update-cover-photo-position', [UserController::class, 'updateCoverPhotoPosition']); // POST /api/users/{id}/update-cover-photo-position
    Route::get('/division/{divisionId}/active-focal-person', [UserController::class, 'getActiveFocalPerson']); // GET /api/users/division/{divisionId}/active-focal-person
});

// File Upload API routes - authenticated users can access
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/upload-image', [App\Http\Controllers\Api\FileUploadController::class, 'uploadImage']);     // POST /api/upload-image
    Route::delete('/delete-image', [App\Http\Controllers\Api\FileUploadController::class, 'deleteImage']);   // DELETE /api/delete-image
});

// Activity Logs API routes - authenticated users can access
Route::middleware(['auth:sanctum'])->prefix('logs')->group(function () {
    Route::get('/', [ActivityLogController::class, 'index']);             // GET /api/logs
    Route::get('/division', [ActivityLogController::class, 'divisionLogs']); // GET /api/logs/division
    Route::get('/export', [ActivityLogController::class, 'export']);      // GET /api/logs/export
    Route::get('/{id}', [ActivityLogController::class, 'show']);          // GET /api/logs/{id}
});

// Request API routes
Route::middleware('auth:sanctum')->prefix('requests')->group(function () {
    // Basic CRUD operations
    Route::get('/stats', [RequestController::class, 'getRequestStats']); // GET /api/requests/stats
    Route::get('/division-stats', [RequestController::class, 'getDivisionStats']); // GET /api/requests/division-stats
    Route::get('/most-requested-items', [RequestController::class, 'getMostRequestedItems']); // GET /api/requests/most-requested-items

    Route::get('/my-division', [RequestController::class, 'myDivisionRequests']); // GET /api/requests/my-division
    // Current user's division supplies endpoint
    Route::get('/my-division-supplies', [RequestController::class, 'getCurrentUserDivisionSupplies']); // GET /api/requests/my-division-supplies
    Route::get('/division/{division_id}/supplies', [RequestController::class, 'getDivisionSupplies']); // GET /api/requests/division/{division_id}/supplies

    Route::get('/', [RequestController::class, 'index']);                    // GET /api/requests
    Route::post('/', [RequestController::class, 'store']);                   // POST /api/requests
    Route::get('/{id}', [RequestController::class, 'show']);                 // GET /api/requests/{id}
    Route::put('/{id}', [RequestController::class, 'update']);               // PUT /api/requests/{id}
    Route::delete('/{id}', [RequestController::class, 'destroy']);           // DELETE /api/requests/{id}

    // Workflow operations
    Route::post('/{id}/evaluate', [RequestController::class, 'evaluate']);   // POST /api/requests/{id}/evaluate
    Route::post('/{id}/approve', [RequestController::class, 'approve']);     // POST /api/requests/{id}/approve

    // Statistics and reporting
    Route::get('/user', [RequestController::class, 'getUserRequests']);      // GET /api/requests/user

    // Additional endpoints (for future use)
    Route::get('/{id}/history', [RequestController::class, 'getRequestHistory']);    // GET /api/requests/{id}/history
    Route::get('/{id}/timeline', [RequestController::class, 'getRequestTimeline']);  // GET /api/requests/{id}/timeline
    Route::get('/{id}/comments', [RequestController::class, 'getComments']);         // GET /api/requests/{id}/comments
    Route::post('/{id}/comments', [RequestController::class, 'addComment']);         // POST /api/requests/{id}/comments
    Route::get('/export', [RequestController::class, 'exportRequests']);             // GET /api/requests/export
    Route::patch('/{id}/ready-for-pickup', [RequestController::class, 'markReadyForPickup']); // POST /api/requests/{id}/mark-ready-for-pickup
    Route::patch('/{id}/mark-received', [RequestController::class, 'markAsReceived']);
});


// Damage Items API routes
Route::middleware('auth:sanctum')->prefix('damage-items')->group(function () {
    Route::get('/', [DamageItemsController::class, 'index']);                    // GET /api/damage-items
    Route::post('/', [DamageItemsController::class, 'store']);                  // POST /api/damage-items
    Route::post('/mark-damaged', [DamageItemsController::class, 'markDamaged']); // POST /api/damage-items/mark-damaged
    Route::get('/statistics', [DamageItemsController::class, 'statistics']);    // GET /api/damage-items/statistics
    Route::get('/item/{itemId}', [DamageItemsController::class, 'getByItem']);  // GET /api/damage-items/item/{itemId}
    Route::get('/{id}', [DamageItemsController::class, 'show']);                // GET /api/damage-items/{id}
    Route::put('/{id}/status', [DamageItemsController::class, 'updateStatus']); // PUT /api/damage-items/{id}/status
});

// Report API routes
Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
    Route::post('/inventory-summary', [ReportController::class, 'generateInventorySummaryReport']);
    Route::post('/supply-requests', [ReportController::class, 'generateSupplyRequestsReport']);
    Route::post('/summary-request', [ReportController::class, 'generateSummaryRequestReport']);
    Route::post('/division-activity', [ReportController::class, 'generateDivisionActivityReport']);
    Route::post('/damaged-items', [ReportController::class, 'generateDamagedItemsReport']);
    Route::post('/user-activity', [ReportController::class, 'generateUserActivityReport']);
    Route::post('/monthly-summary', [ReportController::class, 'generateMonthlySummaryReport']);
    Route::post('/export', [ReportController::class, 'exportReport']);
});

// Notification API routes
Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);                    // GET /api/notifications
    Route::get('/count', [NotificationController::class, 'count']);              // GET /api/notifications/count
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']); // POST /api/notifications/mark-all-read
    Route::post('/{id}/mark-read', [NotificationController::class, 'markAsRead']);   // POST /api/notifications/{id}/mark-read
    Route::delete('/{id}', [NotificationController::class, 'destroy']);          // DELETE /api/notifications/{id}
});


