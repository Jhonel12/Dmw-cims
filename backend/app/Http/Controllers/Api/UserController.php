<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\ActivityLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Display a listing of users with pagination and filters
     */
    public function index(Request $request)
    {
        $query = DB::table('users')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
            ->select(
                'users.*',
                'divisions.name as division_name'
            );

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%")
                    ->orWhere('divisions.name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('users.user_role', $request->role);
        }

        if ($request->filled('division_id')) {
            $query->where('users.division_id', $request->division_id);
        }

        if ($request->filled('status')) {
            $query->where('users.is_active', $request->status === 'active');
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate results
        $perPage = $request->get('per_page', 15);
        $users = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'user_role' => 'required|in:admin,manager,division_chief,focal_person,evaluator',
            'division_id' => 'nullable|exists:divisions,id',
        ], [
            'name.required' => 'User name is required',
            'email.required' => 'Email address is required',
            'email.email' => 'Please enter a valid email address',
            'email.unique' => 'This email address is already registered',
            'password.required' => 'Password is required',
            'password.min' => 'Password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match',
            'user_role.required' => 'User role is required',
            'user_role.in' => 'Invalid user role selected',
            'division_id.exists' => 'Selected division does not exist',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userId = DB::table('users')->insertGetId([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'user_role' => $request->user_role,
                'division_id' => $request->division_id,
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Get the created user with division info
            $user = DB::table('users')
                ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
                ->select('users.*', 'divisions.name as division_name')
                ->where('users.id', $userId)
                ->first();

            // Log the activity
            ActivityLogController::logActivity(
                auth()->id(),
                'created',
                'user',
                $userId,
                "Created user: {$user->name} ({$user->email}) with role: {$user->user_role}"
            );

            return response()->json([
                'status' => 'success',
                'message' => 'User created successfully',
                'data' => $user
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified user
     */
    public function show(string $id)
    {
        $user = DB::table('users')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
            ->select('users.*', 'divisions.name as division_name')
            ->where('users.id', $id)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $user
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, string $id)
    {
        $user = DB::table('users')->where('id', $id)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'sometimes|required|string|min:8|confirmed',
            'user_role' => 'sometimes|required|in:admin,manager,division_chief,focal_person,evaluator',
            'division_id' => 'nullable|exists:divisions,id',
            'avatar' => 'nullable|string|max:500',
            'cover_photo' => 'nullable|string|max:500',
            'cover_photo_position' => 'nullable|numeric|min:0|max:100',
        ], [
            'name.required' => 'User name is required',
            'email.required' => 'Email address is required',
            'email.email' => 'Please enter a valid email address',
            'email.unique' => 'This email address is already registered',
            'password.required' => 'Password is required',
            'password.min' => 'Password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match',
            'user_role.required' => 'User role is required',
            'user_role.in' => 'Invalid user role selected',
            'division_id.exists' => 'Selected division does not exist',
            'avatar.string' => 'Avatar must be a valid string',
            'avatar.max' => 'Avatar URL must not exceed 500 characters',
            'cover_photo.string' => 'Cover photo must be a valid string',
            'cover_photo.max' => 'Cover photo URL must not exceed 500 characters',
            'cover_photo_position.numeric' => 'Cover photo position must be a number',
            'cover_photo_position.min' => 'Cover photo position must be at least 0',
            'cover_photo_position.max' => 'Cover photo position must not exceed 100',
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

            if ($request->filled('user_role')) {
                $updateData['user_role'] = $request->user_role;
            }

            if ($request->has('division_id')) {
                $updateData['division_id'] = $request->division_id;
            }

            if ($request->has('avatar')) {
                $updateData['avatar'] = $request->avatar;
            }

            if ($request->has('cover_photo')) {
                $updateData['cover_photo'] = $request->cover_photo;
            }

            if ($request->has('cover_photo_position')) {
                $updateData['cover_photo_position'] = $request->cover_photo_position;
            }

            DB::table('users')->where('id', $id)->update($updateData);

            // Get the updated user with division info
            $updatedUser = DB::table('users')
                ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
                ->select('users.*', 'divisions.name as division_name')
                ->where('users.id', $id)
                ->first();

            // Log the activity
            $changes = [];
            if ($request->filled('name') && $user->name !== $request->name) {
                $changes[] = "name: {$user->name} → {$request->name}";
            }
            if ($request->filled('email') && $user->email !== $request->email) {
                $changes[] = "email: {$user->email} → {$request->email}";
            }
            if ($request->filled('user_role') && $user->user_role !== $request->user_role) {
                $changes[] = "role: {$user->user_role} → {$request->user_role}";
            }
            if ($request->has('division_id') && $user->division_id != $request->division_id) {
                $oldDivision = $user->division_id ? DB::table('divisions')->where('id', $user->division_id)->value('name') : 'None';
                $newDivision = $request->division_id ? DB::table('divisions')->where('id', $request->division_id)->value('name') : 'None';
                $changes[] = "division: {$oldDivision} → {$newDivision}";
            }
            if ($request->filled('password')) {
                $changes[] = "password: [changed]";
            }
            if ($request->has('avatar') && $user->avatar !== $request->avatar) {
                $changes[] = "avatar: " . ($user->avatar ? "[updated]" : "[added]");
            }
            if ($request->has('cover_photo') && $user->cover_photo !== $request->cover_photo) {
                $changes[] = "cover_photo: " . ($user->cover_photo ? "[updated]" : "[added]");
            }
            if ($request->has('cover_photo_position') && $user->cover_photo_position != $request->cover_photo_position) {
                $changes[] = "cover_photo_position: {$user->cover_photo_position}% → {$request->cover_photo_position}%";
            }

            $changeDetails = empty($changes) ? "No changes made" : implode(', ', $changes);
            ActivityLogController::logActivity(
                auth()->id(),
                'updated',
                'user',
                $id,
                "Updated user: {$updatedUser->name} ({$updatedUser->email}) - {$changeDetails}"
            );

            return response()->json([
                'status' => 'success',
                'message' => 'User updated successfully',
                'data' => $updatedUser
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified user
     */
    public function destroy(string $id)
    {
        $user = DB::table('users')->where('id', $id)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        // Prevent deletion of the last admin user
        if ($user->user_role === 'admin') {
            $adminCount = DB::table('users')->where('user_role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete the last admin user'
                ], 422);
            }
        }

        try {
            // Log the activity before deletion
            ActivityLogController::logActivity(
                auth()->id(),
                'deleted',
                'user',
                $id,
                "Deleted user: {$user->name} ({$user->email}) with role: {$user->user_role}"
            );

            DB::table('users')->where('id', $id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users by division
     */
    public function getUsersByDivision(string $divisionId)
    {
        $users = DB::table('users')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
            ->select('users.*', 'divisions.name as division_name')
            ->where('users.division_id', $divisionId)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    /**
     * Get users by role
     */
    public function getUsersByRole(string $role)
    {
        $users = DB::table('users')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
            ->select('users.*', 'divisions.name as division_name')
            ->where('users.user_role', $role)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    /**
     * Bulk actions on users (activate, deactivate, delete)
     */
    public function bulkAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:users,id',
            'action' => 'required|in:activate,deactivate,delete',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $processed = 0;
            $failed = 0;

            foreach ($request->ids as $userId) {
                try {
                    switch ($request->action) {
                        case 'activate':
                            $user = DB::table('users')->where('id', $userId)->first();
                            DB::table('users')->where('id', $userId)->update(['is_active' => true]);
                            ActivityLogController::logActivity(
                                auth()->id(),
                                'activated',
                                'user',
                                $userId,
                                "Activated user: {$user->name} ({$user->email})"
                            );
                            break;
                        case 'deactivate':
                            $user = DB::table('users')->where('id', $userId)->first();
                            DB::table('users')->where('id', $userId)->update(['is_active' => false]);
                            ActivityLogController::logActivity(
                                auth()->id(),
                                'deactivated',
                                'user',
                                $userId,
                                "Deactivated user: {$user->name} ({$user->email})"
                            );
                            break;
                        case 'delete':
                            // Check if it's the last admin
                            $user = DB::table('users')->where('id', $userId)->first();
                            if ($user && $user->user_role === 'admin') {
                                $adminCount = DB::table('users')->where('user_role', 'admin')->count();
                                if ($adminCount <= 1) {
                                 
                                    continue 2; // Skip to the next iteration of the foreach loop

                                    break;

                                }
                            }
                            ActivityLogController::logActivity(
                                auth()->id(),
                                'deleted',
                                'user',
                                $userId,
                                "Deleted user: {$user->name} ({$user->email}) with role: {$user->user_role}"
                            );
                            DB::table('users')->where('id', $userId)->delete();
                            break;
                    }
                    $processed++;
                } catch (\Exception $e) {
                    $failed++;
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => "Bulk action completed. Processed: {$processed}, Failed: {$failed}",
                'data' => [
                    'processed' => $processed,
                    'failed' => $failed
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to perform bulk action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all evaluators
     */
    public function getEvaluators(Request $request)
    {
        $query = DB::table('users')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
            ->select('users.*', 'divisions.name as division_name')
            ->where('users.user_role', 'evaluator');

        // Apply filters
        if ($request->filled('division_id')) {
            $query->where('users.division_id', $request->division_id);
        }

        if ($request->filled('status')) {
            $query->where('users.is_active', $request->status === 'active');
        }

        // Only get active evaluators by default
        if (!$request->filled('include_inactive')) {
            $query->where('users.is_active', true);
        }

        $evaluators = $request->has('paginate') ? $query->paginate($request->get('per_page', 15)) : $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $evaluators
        ]);
    }

    /**
     * Get user statistics
     */
    public function getStatistics()
    {
        $stats = [
            'total_users' => DB::table('users')->count(),
            'active_users' => DB::table('users')->where('is_active', true)->count(),
            'inactive_users' => DB::table('users')->where('is_active', false)->count(),
            'users_by_role' => DB::table('users')
                ->select('user_role', DB::raw('count(*) as count'))
                ->groupBy('user_role')
                ->get(),
            'users_by_division' => DB::table('users')
                ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
                ->select('divisions.name as division_name', DB::raw('count(users.id) as count'))
                ->groupBy('divisions.id', 'divisions.name')
                ->get(),
            'unassigned_users' => DB::table('users')->whereNull('division_id')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request, string $id)
    {
        $user = DB::table('users')->where('id', $id)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ], [
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
            DB::table('users')->where('id', $id)->update([
                'password' => Hash::make($request->password),
                'updated_at' => now(),
            ]);

            // Log the activity
            ActivityLogController::logActivity(
                auth()->id(),
                'password_changed',
                'user',
                $id,
                "Changed password for user: {$user->name} ({$user->email})"
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Password changed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to change password',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search users
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2',
            'role' => 'nullable|in:admin,manager,staff,viewer,evaluator',
            'division_id' => 'nullable|exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = DB::table('users')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
            ->select('users.*', 'divisions.name as division_name')
            ->where(function ($q) use ($request) {
                $q->where('users.name', 'like', "%{$request->query}%")
                    ->orWhere('users.email', 'like', "%{$request->query}%")
                    ->orWhere('divisions.name', 'like', "%{$request->query}%");
            });

        if ($request->filled('role')) {
            $query->where('users.user_role', $request->role);
        }

        if ($request->filled('division_id')) {
            $query->where('users.division_id', $request->division_id);
        }

        $users = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    /**
     * Update cover photo position
     */
    public function updateCoverPhotoPosition(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'position' => 'required|numeric|min:0|max:100',
        ], [
            'position.required' => 'Position is required',
            'position.numeric' => 'Position must be a number',
            'position.min' => 'Position must be at least 0',
            'position.max' => 'Position must not exceed 100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = DB::table('users')->where('id', $id)->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // Update cover photo position
            DB::table('users')->where('id', $id)->update([
                'cover_photo_position' => $request->position,
                'updated_at' => now()
            ]);

            // Log the activity
            ActivityLogController::logActivity(
                auth()->id(),
                'updated',
                'user',
                $id,
                "Updated cover photo position for user: {$user->name} - position: {$request->position}%"
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Cover photo position updated successfully',
                'data' => [
                    'position' => $request->position
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update cover photo position',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle focal person active status
     * Ensures only one focal person is active per division
     */
    public function toggleFocalPerson(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'is_active' => 'required|boolean',
        ], [
            'is_active.required' => 'Active status is required',
            'is_active.boolean' => 'Active status must be true or false',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = DB::table('users')->where('id', $id)->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // Check if user is a focal person
            if ($user->user_role !== 'focal_person') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User is not a focal person'
                ], 422);
            }

            // If activating a focal person, deactivate all other focal persons in the same division
            if ($request->is_active) {
                DB::table('users')
                    ->where('user_role', 'focal_person')
                    ->where('division_id', $user->division_id)
                    ->where('id', '!=', $id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);

                // Log the deactivation of other focal persons
                $deactivatedUsers = DB::table('users')
                    ->where('user_role', 'focal_person')
                    ->where('division_id', $user->division_id)
                    ->where('id', '!=', $id)
                    ->where('is_active', false)
                    ->get();

                foreach ($deactivatedUsers as $deactivatedUser) {
                    ActivityLogController::logActivity(
                        auth()->id(),
                        'deactivated',
                        'user',
                        $deactivatedUser->id,
                        "Deactivated focal person: {$deactivatedUser->name} ({$deactivatedUser->email}) - replaced by {$user->name}"
                    );
                }
            }

            // Update the focal person's status
            DB::table('users')->where('id', $id)->update([
                'is_active' => $request->is_active,
                'updated_at' => now(),
            ]);

            // Get the updated user with division info
            $updatedUser = DB::table('users')
                ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
                ->select('users.*', 'divisions.name as division_name')
                ->where('users.id', $id)
                ->first();

            // Log the activity
            $action = $request->is_active ? 'activated' : 'deactivated';
            $actionText = $request->is_active ? 'Activated' : 'Deactivated';
            ActivityLogController::logActivity(
                auth()->id(),
                $action,
                'user',
                $id,
                "{$actionText} focal person: {$updatedUser->name} ({$updatedUser->email}) in division: {$updatedUser->division_name}"
            );

            return response()->json([
                'status' => 'success',
                'message' => $request->is_active ? 
                    'Focal person activated successfully. Other focal persons in this division have been deactivated.' : 
                    'Focal person deactivated successfully',
                'data' => $updatedUser
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to toggle focal person status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active focal person for a division
     */
    public function getActiveFocalPerson(string $divisionId)
    {
        try {
            $focalPerson = DB::table('users')
                ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
                ->select('users.*', 'divisions.name as division_name')
                ->where('users.user_role', 'focal_person')
                ->where('users.division_id', $divisionId)
                ->where('users.is_active', true)
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => $focalPerson
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get active focal person',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}