<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Root categories
        $officeSupplies = Category::create([
            'name' => 'Office Supplies',
            'slug' => Str::slug('Office Supplies'),
            'description' => 'General office supplies',
            'icon' => 'folder',
            'color' => 'bg-primary',
        ]);

        $furniture = Category::create([
            'name' => 'Furniture',
            'slug' => Str::slug('Furniture'),
            'description' => 'Office furniture',
            'icon' => 'chair',
            'color' => 'bg-secondary',
        ]);

        $technology = Category::create([
            'name' => 'Technology',
            'slug' => Str::slug('Technology'),
            'description' => 'Tech equipment',
            'icon' => 'computer',
            'color' => 'bg-info',
        ]);

        // Office Supplies sub-categories
        Category::create([
            'name' => 'Writing Instruments',
            'slug' => Str::slug('Writing Instruments'),
            'description' => 'Pens, pencils, markers',
            'parent_id' => $officeSupplies->id,
            'icon' => 'pencil',
        ]);

        Category::create([
            'name' => 'Paper Products',
            'slug' => Str::slug('Paper Products'),
            'description' => 'Notebooks, copy paper, sticky notes',
            'parent_id' => $officeSupplies->id,
            'icon' => 'file',
        ]);

        Category::create([
            'name' => 'Desk Accessories',
            'slug' => Str::slug('Desk Accessories'),
            'description' => 'Staplers, tape, etc.',
            'parent_id' => $officeSupplies->id,
            'icon' => 'paperclip',
        ]);

        // Furniture sub-categories
        Category::create([
            'name' => 'Chairs',
            'slug' => Str::slug('Chairs'),
            'description' => 'Office chairs',
            'parent_id' => $furniture->id,
            'icon' => 'chair',
        ]);

        Category::create([
            'name' => 'Desks',
            'slug' => Str::slug('Desks'),
            'description' => 'Work desks',
            'parent_id' => $furniture->id,
            'icon' => 'desk',
        ]);

        Category::create([
            'name' => 'Storage',
            'slug' => Str::slug('Storage'),
            'description' => 'Filing cabinets, shelves',
            'parent_id' => $furniture->id,
            'icon' => 'archive',
        ]);

        // Technology sub-categories
        Category::create([
            'name' => 'Computers',
            'slug' => Str::slug('Computers'),
            'description' => 'Desktops, laptops',
            'parent_id' => $technology->id,
            'icon' => 'laptop',
        ]);

        Category::create([
            'name' => 'Peripherals',
            'slug' => Str::slug('Peripherals'),
            'description' => 'Monitors, keyboards, mice',
            'parent_id' => $technology->id,
            'icon' => 'keyboard',
        ]);

        Category::create([
            'name' => 'Networking',
            'slug' => Str::slug('Networking'),
            'description' => 'Routers, cables',
            'parent_id' => $technology->id,
            'icon' => 'wifi',
        ]);
    }
}
