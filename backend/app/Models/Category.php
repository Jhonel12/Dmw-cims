<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'color',
        'parent_id',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the parent category.
     */
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * Get the subcategories.
     */
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * Get all items belonging to this category.
     */
    public function items()
    {
        return $this->hasMany(Item::class);
    }

    /**
     * Get all ancestors of this category in hierarchical order (oldest first)
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getAncestors()
    {
        $ancestors = collect([]);
        $category = $this;

        while ($category->parent) {
            $ancestors->push($category->parent);
            $category = $category->parent;
        }

        return $ancestors->reverse();
    }

    /**
     * Get all descendants (subcategories) of this category
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getAllDescendants()
    {
        $descendants = collect([]);

        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getAllDescendants());
        }

        return $descendants;
    }

    /**
     * Check if the category is a root category (no parent)
     * 
     * @return bool
     */
    public function isRoot()
    {
        return is_null($this->parent_id);
    }

    /**
     * Check if the category is a leaf node (no children)
     * 
     * @return bool
     */
    public function isLeaf()
    {
        return $this->children()->count() == 0;
    }

    /**
     * Check if this category is a descendant of the given category
     * 
     * @param Category $category
     * @return bool
     */
    public function isDescendantOf(Category $category)
    {
        if ($this->parent_id == $category->id) {
            return true;
        }

        if ($this->parent) {
            return $this->parent->isDescendantOf($category);
        }

        return false;
    }

    /**
     * Check if this category is an ancestor of the given category
     * 
     * @param Category $category
     * @return bool
     */
    public function isAncestorOf(Category $category)
    {
        return $category->isDescendantOf($this);
    }
}
