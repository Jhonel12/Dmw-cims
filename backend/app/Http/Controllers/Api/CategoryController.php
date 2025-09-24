<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    use LogsActivity;
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = Category::with('children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = new Category();
        $category->name = $request->name;
        $category->slug = Str::slug($request->name);
        $category->description = $request->description;
        $category->icon = $request->icon;
        $category->color = $request->color ?? 'bg-light';
        $category->parent_id = $request->parent_id;
        $category->is_active = $request->has('is_active') ? $request->is_active : true;
        $category->save();

        // Log the creation activity with explicit user ID check
        if (auth()->check()) {
            $this->logCreation('Category', $category->id, "Created category: {$category->name}");
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Category created successfully',
            'data' => $category
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = Category::with(['parent', 'children'])
            ->find($id);

        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Category not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $category
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Category not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Don't allow a category to be its own parent
        if ($request->has('parent_id') && $request->parent_id == $id) {
            return response()->json([
                'status' => 'error',
                'message' => 'A category cannot be its own parent'
            ], 422);
        }

        if ($request->has('name')) {
            $category->name = $request->name;
            $category->slug = Str::slug($request->name);
        }

        if ($request->has('description')) {
            $category->description = $request->description;
        }

        if ($request->has('icon')) {
            $category->icon = $request->icon;
        }

        if ($request->has('color')) {
            $category->color = $request->color;
        }

        if ($request->has('parent_id')) {
            $category->parent_id = $request->parent_id;
        }

        if ($request->has('is_active')) {
            $category->is_active = $request->is_active;
        }

        $category->save();

        // Log the update activity with explicit user ID check
        if (auth()->check()) {
            $this->logUpdate('Category', $category->id, "Updated category: {$category->name}");
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Category updated successfully',
            'data' => $category
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Category not found'
            ], 404);
        }

        // Check if category has items
        if ($category->items()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete category with associated items. Please reassign or delete the items first.'
            ], 422);
        }

        // Check if category has children
        if ($category->children()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete category with subcategories. Please delete or reassign the subcategories first.'
            ], 422);
        }

        // Log the deletion activity before deleting with explicit user ID check
        if (auth()->check()) {
            $this->logDeletion('Category', $category->id, "Deleted category: {$category->name}");
        }

        $category->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Category deleted successfully'
        ]);
    }

    /**
     * Get categories for dropdown selection
     */
    public function getForDropdown()
    {
        $categories = Category::where('is_active', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    /**
     * Get active categories for the frontend
     */
    public function getActiveCategories()
    {
        $categories = Category::where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * List all categories without pagination
     */
    public function listAll()
    {
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    /**
     * Get category tree structure
     */
    public function getTree()
    {
        $categories = Category::with('children')
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    /**
     * Perform bulk actions on categories
     */
    public function bulkAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|string|in:activate,deactivate,delete',
            'ids' => 'required|array',
            'ids.*' => 'exists:categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $action = $request->action;
        $ids = $request->ids;
        $count = 0;

        switch ($action) {
            case 'activate':
                $count = Category::whereIn('id', $ids)->update(['is_active' => true]);
                break;
            case 'deactivate':
                $count = Category::whereIn('id', $ids)->update(['is_active' => false]);
                break;
            case 'delete':
                // Check for related items or children
                $hasRelated = Category::whereIn('id', $ids)
                    ->whereHas('items')
                    ->orWhereHas('children')
                    ->count() > 0;

                if ($hasRelated) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Some categories cannot be deleted because they have related items or subcategories'
                    ], 422);
                }

                $count = Category::whereIn('id', $ids)->delete();
                break;
        }

        return response()->json([
            'status' => 'success',
            'message' => $count . ' categories ' . $action . 'd successfully'
        ]);
    }

    /**
     * Get category path from root to specified category
     */
    public function getCategoryPath(string $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Category not found'
            ], 404);
        }

        $path = $category->getAncestors()->push($category);

        return response()->json([
            'status' => 'success',
            'data' => $path
        ]);
    }

    /**
     * Move a category to a new parent
     */
    public function moveCategory(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Category not found'
            ], 404);
        }

        // Make sure category is not being moved to itself or one of its descendants
        if ($request->parent_id) {
            if ($request->parent_id == $id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'A category cannot be its own parent'
                ], 422);
            }

            $potentialParent = Category::find($request->parent_id);
            $descendants = $category->getAllDescendants()->pluck('id')->toArray();

            if (in_array($potentialParent->id, $descendants)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot move a category to one of its descendants'
                ], 422);
            }
        }

        $category->parent_id = $request->parent_id;
        $category->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Category moved successfully',
            'data' => $category
        ]);
    }
}
