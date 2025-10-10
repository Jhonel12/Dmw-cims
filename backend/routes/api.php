<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\OFWController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CustomerFeedbackController;
use App\Http\Controllers\SurveyAnalyticsController;
use App\Http\Controllers\SurveyReportsController;

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

// Token validation route (doesn't update activity timer)
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::get('/check', [AuthController::class, 'checkToken']);
});

// Protected authentication routes
Route::middleware(['auth:sanctum', 'check.token.activity'])->prefix('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});
Route::post('/clients', [ClientController::class, 'store']);
// Client routes (protected)
Route::middleware(['auth:sanctum', 'check.token.activity'])->prefix('clients')->group(function () {
    Route::get('/', [ClientController::class, 'index']);                    // GET /api/clients
               // POST /api/clients
    Route::get('/stats', [ClientController::class, 'stats']);              // GET /api/clients/stats
    Route::get('/trashed', [ClientController::class, 'trashed']);          // GET /api/clients/trashed
    Route::get('/{id}', [ClientController::class, 'show']);                // GET /api/clients/{id}
    Route::put('/{id}', [ClientController::class, 'update']);              // PUT /api/clients/{id}
    Route::delete('/{id}', [ClientController::class, 'destroy']);          // DELETE /api/clients/{id}
    Route::post('/{id}/restore', [ClientController::class, 'restore']);    // POST /api/clients/{id}/restore
    Route::delete('/{id}/force', [ClientController::class, 'forceDelete']); // DELETE /api/clients/{id}/force
});

// OFW routes (protected)
Route::middleware(['auth:sanctum', 'check.token.activity'])->prefix('ofw')->group(function () {
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

// User management routes (protected)
Route::middleware(['auth:sanctum', 'check.token.activity'])->prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'getUsers']);                  // GET /api/users
    Route::get('/stats', [UserController::class, 'getUserStats']);         // GET /api/users/stats
    Route::post('/', [UserController::class, 'createUser']);               // POST /api/users
    Route::get('/{id}', [UserController::class, 'getUser']);               // GET /api/users/{id}
    Route::put('/{id}', [UserController::class, 'updateUser']);            // PUT /api/users/{id}
    Route::delete('/{id}', [UserController::class, 'deleteUser']);         // DELETE /api/users/{id}
    Route::put('/profile', [UserController::class, 'updateProfile']);      // PUT /api/users/profile
    Route::put('/password', [UserController::class, 'changePassword']);    // PUT /api/users/password
});

// Customer feedback routes
Route::post('/customer-feedback', [CustomerFeedbackController::class, 'store']); // Public - for form submission

// Protected customer feedback routes (admin only)
Route::middleware(['auth:sanctum', 'check.token.activity'])->prefix('customer-feedback')->group(function () {
    Route::get('/', [CustomerFeedbackController::class, 'index']);
    Route::get('/list', [CustomerFeedbackController::class, 'getSurveyList']);
    Route::get('/statistics', [CustomerFeedbackController::class, 'statistics']);
});

// Survey Analytics routes (protected)
Route::middleware(['auth:sanctum', 'check.token.activity'])->prefix('survey-analytics')->group(function () {
    Route::get('/', [SurveyAnalyticsController::class, 'getAnalytics']);                    // GET /api/survey-analytics
    Route::get('/satisfaction-by-service', [SurveyAnalyticsController::class, 'getSatisfactionByService']); // GET /api/survey-analytics/satisfaction-by-service
    Route::get('/trends', [SurveyAnalyticsController::class, 'getSatisfactionTrends']);     // GET /api/survey-analytics/trends
    Route::get('/regional', [SurveyAnalyticsController::class, 'getRegionalAnalytics']);   // GET /api/survey-analytics/regional
    Route::post('/export', [SurveyAnalyticsController::class, 'exportAnalytics']);         // POST /api/survey-analytics/export
});

// Survey Reports routes (protected)
Route::middleware(['auth:sanctum', 'check.token.activity'])->prefix('survey-reports')->group(function () {
    Route::get('/', [SurveyReportsController::class, 'index']);                             // GET /api/survey-reports
    Route::post('/generate', [SurveyReportsController::class, 'generateReport']);          // POST /api/survey-reports/generate
    Route::get('/download/{reportId}', [SurveyReportsController::class, 'downloadReport']); // GET /api/survey-reports/download/{reportId}
    Route::get('/statistics', [SurveyReportsController::class, 'getStatistics']);          // GET /api/survey-reports/statistics
    Route::post('/export/csv', [SurveyReportsController::class, 'exportToCsv']);           // POST /api/survey-reports/export/csv
    Route::post('/export/pdf', [SurveyReportsController::class, 'exportToPdf']);           // POST /api/survey-reports/export/pdf
});

// Client Suggestions routes (protected)
Route::middleware(['auth:sanctum', 'check.token.activity'])->prefix('client-suggestions')->group(function () {
    Route::get('/', [App\Http\Controllers\ClientSuggestionsController::class, 'index']);              // GET /api/client-suggestions
    Route::get('/{id}', [App\Http\Controllers\ClientSuggestionsController::class, 'show']);           // GET /api/client-suggestions/{id}
    Route::get('/statistics', [App\Http\Controllers\ClientSuggestionsController::class, 'getStatistics']); // GET /api/client-suggestions/statistics
    Route::post('/export/csv', [App\Http\Controllers\ClientSuggestionsController::class, 'exportToCsv']); // POST /api/client-suggestions/export/csv
    Route::post('/export/pdf', [App\Http\Controllers\ClientSuggestionsController::class, 'exportToPdf']); // POST /api/client-suggestions/export/pdf
});

// Test route to verify API is working
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()
    ]);
});
