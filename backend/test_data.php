<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Categories in database:\n";
$categories = DB::table('categories')->get(['id', 'name']);
foreach($categories as $cat) {
    echo $cat->id . ': ' . $cat->name . "\n";
}

echo "\nItems in Office Supplies category:\n";
$items = DB::table('items')
    ->join('categories', 'items.category_id', '=', 'categories.id')
    ->where('categories.name', 'Office Supplies')
    ->get(['items.item_name', 'categories.name as category_name']);

echo "Count: " . $items->count() . "\n";
foreach($items as $item) {
    echo $item->item_name . ' -> ' . $item->category_name . "\n";
}

echo "\nAll items with their categories:\n";
$allItems = DB::table('items')
    ->join('categories', 'items.category_id', '=', 'categories.id')
    ->get(['items.item_name', 'categories.name as category_name']);

foreach($allItems as $item) {
    echo $item->item_name . ' -> ' . $item->category_name . "\n";
}
