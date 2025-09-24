<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Item;
use App\Models\Category;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get category IDs
        $writingInstrumentsId = Category::where('name', 'Writing Instruments')->first()->id;
        $paperProductsId = Category::where('name', 'Paper Products')->first()->id;
        $deskAccessoriesId = Category::where('name', 'Desk Accessories')->first()->id;
        $peripheralsId = Category::where('name', 'Peripherals')->first()->id;

        // Office Supplies - Writing Instruments
        Item::create([
            'item_no' => 'PEN-001',
            'item_name' => 'Ballpoint Pen - Blue',
            'category_id' => $writingInstrumentsId,
            'description' => 'Medium point ballpoint pen with blue ink',
            'quantity_on_hand' => 150,
            'unit' => 'Piece',
            'reorder_level' => 30,
            'reorder_quantity' => 100,
            'supplier' => 'Office Depot',
            'location' => 'Storage Room A1',
            'notes' => 'Popular item, keep well-stocked'
        ]);

        Item::create([
            'item_no' => 'PEN-002',
            'item_name' => 'Ballpoint Pen - Black',
            'category_id' => $writingInstrumentsId,
            'description' => 'Medium point ballpoint pen with black ink',
            'quantity_on_hand' => 125,
            'unit' => 'Piece',
            'reorder_level' => 30,
            'reorder_quantity' => 100,
            'supplier' => 'Office Depot',
            'location' => 'Storage Room A1',
        ]);

        Item::create([
            'item_no' => 'PEN-003',
            'item_name' => 'Gel Pen - Assorted Colors',
            'category_id' => $writingInstrumentsId,
            'description' => 'Set of gel pens in various colors',
            'quantity_on_hand' => 45,
            'unit' => 'Pack',
            'reorder_level' => 10,
            'reorder_quantity' => 30,
            'supplier' => 'Staples',
            'location' => 'Storage Room A1',
        ]);

        // Office Supplies - Paper Products
        Item::create([
            'item_no' => 'PAP-001',
            'item_name' => 'Copy Paper - Letter Size',
            'category_id' => $paperProductsId,
            'description' => '8.5" x 11" white copy paper, 20lb weight',
            'quantity_on_hand' => 50,
            'unit' => 'Ream',
            'reorder_level' => 15,
            'reorder_quantity' => 40,
            'supplier' => 'Office Depot',
            'location' => 'Storage Room B2',
            'notes' => 'Used for general office printing'
        ]);

        Item::create([
            'item_no' => 'PAP-002',
            'item_name' => 'Sticky Notes - 3x3',
            'category_id' => $paperProductsId,
            'description' => '3" x 3" yellow sticky notes',
            'quantity_on_hand' => 75,
            'unit' => 'Pad',
            'reorder_level' => 25,
            'reorder_quantity' => 50,
            'supplier' => 'Staples',
            'location' => 'Storage Room A2',
        ]);

        Item::create([
            'item_no' => 'PAP-003',
            'item_name' => 'Notebook - Spiral Bound',
            'category_id' => $paperProductsId,
            'description' => 'College ruled, 70-page spiral notebook',
            'quantity_on_hand' => 35,
            'unit' => 'Piece',
            'reorder_level' => 20,
            'reorder_quantity' => 40,
            'supplier' => 'Office Depot',
            'location' => 'Storage Room A2',
        ]);

        // Office Supplies - Desk Accessories
        Item::create([
            'item_no' => 'DSK-001',
            'item_name' => 'Stapler - Desktop',
            'category_id' => $deskAccessoriesId,
            'description' => 'Standard desktop stapler, black',
            'quantity_on_hand' => 25,
            'unit' => 'Piece',
            'reorder_level' => 8,
            'reorder_quantity' => 20,
            'supplier' => 'Office Depot',
            'location' => 'Storage Room A3',
        ]);

        Item::create([
            'item_no' => 'DSK-002',
            'item_name' => 'Tape Dispenser',
            'category_id' => $deskAccessoriesId,
            'description' => 'Desktop tape dispenser for standard tape',
            'quantity_on_hand' => 20,
            'unit' => 'Piece',
            'reorder_level' => 7,
            'reorder_quantity' => 15,
            'supplier' => 'Staples',
            'location' => 'Storage Room A3',
        ]);

        // Technology - Peripherals
        Item::create([
            'item_no' => 'PER-001',
            'item_name' => 'USB Mouse',
            'category_id' => $peripheralsId,
            'description' => 'Standard USB optical mouse',
            'quantity_on_hand' => 15,
            'unit' => 'Piece',
            'reorder_level' => 5,
            'reorder_quantity' => 10,
            'supplier' => 'Dell',
            'location' => 'Storage Room C1',
        ]);

        Item::create([
            'item_no' => 'PER-002',
            'item_name' => 'Keyboard - Wired',
            'category_id' => $peripheralsId,
            'description' => 'Standard USB keyboard',
            'quantity_on_hand' => 12,
            'unit' => 'Piece',
            'reorder_level' => 5,
            'reorder_quantity' => 10,
            'supplier' => 'Dell',
            'location' => 'Storage Room C1',
            'notes' => 'Compatible with all office systems'
        ]);
    }
}
