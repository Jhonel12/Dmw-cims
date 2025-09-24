<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ClientController extends Controller
{
    /**
     * Display a listing of clients
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('clients')
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc');

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('city', 'like', "%{$search}%")
                      ->orWhere('province', 'like', "%{$search}%");
                });
            }

            // Filter by verification status
            if ($request->has('status') && $request->status !== 'All') {
                switch ($request->status) {
                    case 'Active':
                        $query->where('has_national_id', true);
                        break;
                    case 'Inactive':
                        $query->where('has_national_id', false);
                        break;
                    case 'Pending':
                        $query->whereRaw('created_at = updated_at');
                        break;
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $clients = $query->paginate($perPage);

            // Decode JSON fields for each client
            $clients->getCollection()->transform(function ($client) {
                $client->social_classification = json_decode($client->social_classification, true);
                return $client;
            });

            return response()->json([
                'success' => true,
                'message' => 'Clients retrieved successfully',
                'data' => $clients
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving clients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created client
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'suffix' => 'nullable|string|max:10',
                'date_of_birth' => 'required|date|before:today',
                'age' => 'nullable|integer|min:0|max:120',
                'civil_status' => 'required|in:Single,Married,Widowed,Divorced,Separated',
                'sex' => 'required|in:Male,Female',
                'social_classification' => 'required|array|min:1',
                'social_classification.*' => 'string|in:OFW,Indigenous People,Senior Citizen,Youth,Others',
                'social_classification_other' => 'nullable|string|max:255',
                'house_number' => 'required|string|max:255',
                'street' => 'required|string|max:255',
                'barangay' => 'required|string|max:255',
                'city' => 'required|string|max:255',
                'province' => 'required|string|max:255',
                'region' => 'required|string|max:255',
                'zip_code' => 'required|string|max:10',
                'telephone' => 'required|string|max:20',
                'email' => 'required|email|unique:clients,email',
                'emergency_name' => 'required|string|max:255',
                'emergency_telephone' => 'required|string|max:20',
                'emergency_relationship' => 'required|string|max:255',
                'has_national_id' => 'required|boolean',
                'national_id_number' => 'nullable|string|max:20|unique:clients,national_id_number'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Calculate age if not provided
            $age = $request->age;
            if (!$age) {
                $birthDate = Carbon::parse($request->date_of_birth);
                $age = $birthDate->age;
            }

            // Prepare data for insertion
            $clientData = [
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'suffix' => $request->suffix,
                'date_of_birth' => $request->date_of_birth,
                'age' => $age,
                'civil_status' => $request->civil_status,
                'sex' => $request->sex,
                'social_classification' => json_encode($request->social_classification),
                'social_classification_other' => $request->social_classification_other,
                'house_number' => $request->house_number,
                'street' => $request->street,
                'barangay' => $request->barangay,
                'city' => $request->city,
                'province' => $request->province,
                'region' => $request->region,
                'zip_code' => $request->zip_code,
                'telephone' => $request->telephone,
                'email' => $request->email,
                'emergency_name' => $request->emergency_name,
                'emergency_telephone' => $request->emergency_telephone,
                'emergency_relationship' => $request->emergency_relationship,
                'has_national_id' => $request->has_national_id,
                'national_id_number' => $request->national_id_number,
                'created_at' => now(),
                'updated_at' => now()
            ];

            $clientId = DB::table('clients')->insertGetId($clientData);

            // Get the created client
            $client = DB::table('clients')->where('id', $clientId)->first();
            $client->social_classification = json_decode($client->social_classification, true);

            return response()->json([
                'success' => true,
                'message' => 'Client created successfully',
                'data' => $client
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified client
     */
    public function show($id)
    {
        try {
            $client = DB::table('clients')
                ->where('id', $id)
                ->whereNull('deleted_at')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            $client->social_classification = json_decode($client->social_classification, true);

            return response()->json([
                'success' => true,
                'message' => 'Client retrieved successfully',
                'data' => $client
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified client
     */
    public function update(Request $request, $id)
    {
        try {
            $client = DB::table('clients')
                ->where('id', $id)
                ->whereNull('deleted_at')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'suffix' => 'nullable|string|max:10',
                'date_of_birth' => 'sometimes|required|date|before:today',
                'age' => 'nullable|integer|min:0|max:120',
                'civil_status' => 'sometimes|required|in:Single,Married,Widowed,Divorced,Separated',
                'sex' => 'sometimes|required|in:Male,Female',
                'social_classification' => 'sometimes|required|array|min:1',
                'social_classification.*' => 'string|in:OFW,Indigenous People,Senior Citizen,Youth,Others',
                'social_classification_other' => 'nullable|string|max:255',
                'house_number' => 'sometimes|required|string|max:255',
                'street' => 'sometimes|required|string|max:255',
                'barangay' => 'sometimes|required|string|max:255',
                'city' => 'sometimes|required|string|max:255',
                'province' => 'sometimes|required|string|max:255',
                'region' => 'sometimes|required|string|max:255',
                'zip_code' => 'sometimes|required|string|max:10',
                'telephone' => 'sometimes|required|string|max:20',
                'email' => 'sometimes|required|email|unique:clients,email,' . $id,
                'emergency_name' => 'sometimes|required|string|max:255',
                'emergency_telephone' => 'sometimes|required|string|max:20',
                'emergency_relationship' => 'sometimes|required|string|max:255',
                'has_national_id' => 'sometimes|required|boolean',
                'national_id_number' => 'nullable|string|max:20|unique:clients,national_id_number,' . $id
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only([
                'first_name', 'middle_name', 'last_name', 'suffix',
                'date_of_birth', 'age', 'civil_status', 'sex',
                'social_classification', 'social_classification_other',
                'house_number', 'street', 'barangay', 'city',
                'province', 'region', 'zip_code', 'telephone',
                'email', 'emergency_name', 'emergency_telephone',
                'emergency_relationship', 'has_national_id', 'national_id_number'
            ]);

            // Calculate age if date_of_birth is updated and age is not provided
            if (isset($updateData['date_of_birth']) && !isset($updateData['age'])) {
                $birthDate = Carbon::parse($updateData['date_of_birth']);
                $updateData['age'] = $birthDate->age;
            }

            // Encode social_classification if provided
            if (isset($updateData['social_classification'])) {
                $updateData['social_classification'] = json_encode($updateData['social_classification']);
            }

            $updateData['updated_at'] = now();

            DB::table('clients')
                ->where('id', $id)
                ->update($updateData);

            // Get updated client
            $updatedClient = DB::table('clients')->where('id', $id)->first();
            $updatedClient->social_classification = json_decode($updatedClient->social_classification, true);

            return response()->json([
                'success' => true,
                'message' => 'Client updated successfully',
                'data' => $updatedClient
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete the specified client
     */
    public function destroy($id)
    {
        try {
            $client = DB::table('clients')
                ->where('id', $id)
                ->whereNull('deleted_at')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            DB::table('clients')
                ->where('id', $id)
                ->update(['deleted_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Client deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore a soft deleted client
     */
    public function restore($id)
    {
        try {
            $client = DB::table('clients')
                ->where('id', $id)
                ->whereNotNull('deleted_at')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found or not deleted'
                ], 404);
            }

            DB::table('clients')
                ->where('id', $id)
                ->update(['deleted_at' => null, 'updated_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Client restored successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error restoring client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete a client
     */
    public function forceDelete($id)
    {
        try {
            $client = DB::table('clients')
                ->where('id', $id)
                ->whereNotNull('deleted_at')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found or not deleted'
                ], 404);
            }

            DB::table('clients')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Client permanently deleted'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error permanently deleting client',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trashed clients
     */
    public function trashed()
    {
        try {
            $trashedClients = DB::table('clients')
                ->whereNotNull('deleted_at')
                ->orderBy('deleted_at', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'message' => 'Trashed clients retrieved successfully',
                'data' => $trashedClients
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving trashed clients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get client statistics
     */
    public function stats()
    {
        try {
            $stats = [
                'total_clients' => DB::table('clients')->whereNull('deleted_at')->count(),
                'verified_clients' => DB::table('clients')->whereNull('deleted_at')->where('has_national_id', true)->count(),
                'unverified_clients' => DB::table('clients')->whereNull('deleted_at')->where('has_national_id', false)->count(),
                'ofw_clients' => DB::table('clients')
                    ->whereNull('deleted_at')
                    ->whereRaw("JSON_CONTAINS(social_classification, '\"OFW\"')")
                    ->count(),
                'trashed_clients' => DB::table('clients')->whereNotNull('deleted_at')->count()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Client statistics retrieved successfully',
                'data' => $stats
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving client statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
