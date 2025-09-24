<?php

namespace App\Http\Controllers\Api;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and create token
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'nullable|string',
        ], [
            'email.required' => 'Email address is required',
            'email.email' => 'Please enter a valid email address',
            'password.required' => 'Password is required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get the user via Eloquent
            $user = User::where('email', $request->email)->first();

            // Check if credentials are valid
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Check if user is active
            if (!$user->is_active) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Account is deactivated. Please contact administrator.'
                ], 403);
            }

            // Get division name if exists
            $divisionName = null;
            if ($user->division_id) {
                $divisionName = DB::table('divisions')->where('id', $user->division_id)->value('name');
            }

            // Create token with Sanctum
            $token = $user->createToken($request->device_name ?? 'dmw-app')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_role' => $user->user_role,
                        'division_id' => $user->division_id,
                        'division_name' => $divisionName,
                        'avatar' => $user->avatar,
                        'cover_photo' => $user->cover_photo,
                        'cover_photo_position' => $user->cover_photo_position ?? 50.00,
                        'is_active' => $user->is_active,
                        'is_superadmin' => $user->is_superadmin,
                        'created_at' => $user->created_at,
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer',
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated user profile
     */
    public function profile(Request $request)
    {
        try {
            $user = DB::table('users')
                ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
                ->select('users.*', 'divisions.name as division_name')
                ->where('users.id', $request->user()->id)
                ->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'user_role' => $user->user_role,
                    'division_id' => $user->division_id,
                    'division_name' => $user->division_name,
                    'avatar' => $user->avatar,
                    'cover_photo' => $user->cover_photo,
                    'cover_photo_position' => $user->cover_photo_position ?? 50.00,
                    'is_active' => $user->is_active,
                    'is_superadmin' => $user->is_superadmin,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $request->user()->id,
            'password' => 'sometimes|required|string|min:8|confirmed',
        ], [
            'name.required' => 'Name is required',
            'email.required' => 'Email address is required',
            'email.email' => 'Please enter a valid email address',
            'email.unique' => 'This email address is already registered',
            'password.required' => 'Password is required',
            'password.min' => 'Password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [
                'updated_at' => now(),
            ];

            if ($request->filled('name')) {
                $updateData['name'] = $request->name;
            }

            if ($request->filled('email')) {
                $updateData['email'] = $request->email;
            }

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            DB::table('users')->where('id', $request->user()->id)->update($updateData);

            // Get updated user with division info
            $user = DB::table('users')
                ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
                ->select('users.*', 'divisions.name as division_name')
                ->where('users.id', $request->user()->id)
                ->first();

            return response()->json([
                'status' => 'success',
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'user_role' => $user->user_role,
                    'division_id' => $user->division_id,
                    'division_name' => $user->division_name,
                    'avatar' => $user->avatar,
                    'cover_photo' => $user->cover_photo,
                    'cover_photo_position' => $user->cover_photo_position ?? 50.00,
                    'is_active' => $user->is_active,
                    'is_superadmin' => $user->is_superadmin,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user();
            $user->tokens()->delete();
            $token = $user->createToken('dmw-app')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token' => $token,
                    'token_type' => 'Bearer',
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to refresh token',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user permissions based on role
     */
    public function permissions(Request $request)
    {
        try {
            $user = DB::table('users')
                ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
                ->select('users.*', 'divisions.name as division_name')
                ->where('users.id', $request->user()->id)
                ->first();

            $permissions = [
                'can_access_all_divisions' => in_array($user->user_role, ['admin', 'viewer', 'evaluator']),
                'can_manage_users' => in_array($user->user_role, ['admin']),
                'can_manage_divisions' => in_array($user->user_role, ['admin', 'manager']),
                'can_manage_supplies' => in_array($user->user_role, ['admin', 'manager', 'staff']),
                'can_view_reports' => in_array($user->user_role, ['admin', 'manager', 'viewer', 'evaluator']),
                'can_export_data' => in_array($user->user_role, ['admin', 'manager', 'evaluator']),
                'can_view_reports' => in_array($user->user_role, ['admin', 'manager', 'viewer', 'evaluator']),
                'can_export_data' => in_array($user->user_role, ['admin', 'manager']),
                'can_bulk_actions' => in_array($user->user_role, ['admin', 'manager']),
                'can_evaluate_supplies' => in_array($user->user_role, ['admin', 'evaluator']),
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user_role' => $user->user_role,
                    'division_id' => $user->division_id,
                    'division_name' => $user->division_name,
                    'is_superadmin' => $user->is_superadmin,
                    'permissions' => $permissions,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}