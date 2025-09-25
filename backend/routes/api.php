<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\OFWController;

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

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/validate-email', [AuthController::class, 'validateEmail']);
    Route::post('/validate-password', [AuthController::class, 'validatePassword']);
});

// Protected authentication routes
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

// Client routes (protected)
Route::middleware('auth:sanctum')->prefix('clients')->group(function () {
    Route::get('/', [ClientController::class, 'index']);                    // GET /api/clients
    Route::post('/', [ClientController::class, 'store']);                  // POST /api/clients
    Route::get('/stats', [ClientController::class, 'stats']);              // GET /api/clients/stats
    Route::get('/trashed', [ClientController::class, 'trashed']);          // GET /api/clients/trashed
    Route::get('/{id}', [ClientController::class, 'show']);                // GET /api/clients/{id}
    Route::put('/{id}', [ClientController::class, 'update']);              // PUT /api/clients/{id}
    Route::delete('/{id}', [ClientController::class, 'destroy']);          // DELETE /api/clients/{id}
    Route::post('/{id}/restore', [ClientController::class, 'restore']);    // POST /api/clients/{id}/restore
    Route::delete('/{id}/force', [ClientController::class, 'forceDelete']); // DELETE /api/clients/{id}/force
});

// OFW routes (protected)
Route::middleware('auth:sanctum')->prefix('ofw')->group(function () {
    Route::get('/', [OFWController::class, 'index']);                      // GET /api/ofw
    Route::post('/', [OFWController::class, 'store']);                     // POST /api/ofw
    Route::get('/statistics', [OFWController::class, 'statistics']);       // GET /api/ofw/statistics
    Route::get('/reports', [OFWController::class, 'getReports']);          // GET /api/ofw/reports
    Route::get('/export/excel', [OFWController::class, 'exportExcel']);    // GET /api/ofw/export/excel
    Route::get('/export/pdf', [OFWController::class, 'exportPdf']);        // GET /api/ofw/export/pdf
    Route::get('/trashed', [OFWController::class, 'trashed']);             // GET /api/ofw/trashed
    Route::post('/search/oec', [OFWController::class, 'searchByOEC']);     // POST /api/ofw/search/oec
    Route::get('/{id}', [OFWController::class, 'show']);                   // GET /api/ofw/{id}
    Route::put('/{id}', [OFWController::class, 'update']);                 // PUT /api/ofw/{id}
    Route::delete('/{id}', [OFWController::class, 'destroy']);             // DELETE /api/ofw/{id}
    Route::post('/{id}/restore', [OFWController::class, 'restore']);       // POST /api/ofw/{id}/restore
    Route::delete('/{id}/force', [OFWController::class, 'forceDelete']);   // DELETE /api/ofw/{id}/force
});

// Test route to verify API is working
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()
    ]);
});
