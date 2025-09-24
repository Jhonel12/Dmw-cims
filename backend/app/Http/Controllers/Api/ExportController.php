<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class ExportController extends Controller
{
    /**
     * Export items to Excel file with proper formatting
     */
    public function exportItems(Request $request)
    {
        // Create new Spreadsheet object
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Office Supplies Inventory');
        
        // Set page margins
        $sheet->getPageMargins()
            ->setTop(0.5)
            ->setRight(0.5)
            ->setLeft(0.5)
            ->setBottom(0.5);
            
        // Add logo - larger size spanning more cells
        $logoPath = public_path('images/logo.png');
        if (file_exists($logoPath)) {
            $drawing = new Drawing();
            $drawing->setName('Logo');
            $drawing->setDescription('Department Logo');
            $drawing->setPath($logoPath);
            $drawing->setCoordinates('A1');
            $drawing->setHeight(150); // Increased height
            $drawing->setOffsetX(10);
            $drawing->setOffsetY(10);
            $drawing->setWorksheet($sheet);
            
            // Create merged cells for logo space
            $sheet->mergeCells('A1:L8');
        }
        
        // Create a header band
        $sheet->mergeCells('A10:I10');
        $sheet->setCellValue('A10', 'OFFICE SUPPLIES INVENTORY LIST');
        
        // Set style for logo area
        $sheet->getStyle('A1:L8')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A1:L8')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        
        // Style the inventory list title
        $sheet->getStyle('A10')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 14,
                'color' => ['rgb' => '000000'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => '99CCFF'], // Light blue background
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'outline' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);
        
        // Set column headers (row 12)
        $sheet->setCellValue('A12', 'ITEM NO.');
        $sheet->setCellValue('B12', 'ITEM NAME');
        $sheet->setCellValue('C12', 'CATEGORY');
        $sheet->setCellValue('D12', 'DESCRIPTION');
        $sheet->setCellValue('E12', 'QUANTITY ON HAND');
        $sheet->setCellValue('F12', 'UNIT');
        $sheet->setCellValue('G12', 'REORDER LEVEL');
        $sheet->setCellValue('H12', 'SUPPLIER');
        $sheet->setCellValue('I12', 'LOCATION');
        
        // Style column headers
        $headerRange = 'A12:I12';
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => '000000'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => 'FFFF00'], // Yellow background
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
        ]);
        
        // Get data
        $items = Item::with('category')->get();
        
        // Populate data
        $row = 13;
        $count = 1;
        
        foreach ($items as $item) {
            $sheet->setCellValue('A' . $row, $count);
            $sheet->setCellValue('B' . $row, strtoupper($item->item_name));
            $sheet->setCellValue('C' . $row, $item->category ? strtoupper($item->category->name) : '');
            $sheet->setCellValue('D' . $row, $item->description);
            $sheet->setCellValue('E' . $row, $item->quantity_on_hand ?? 0);
            $sheet->setCellValue('F' . $row, strtoupper($item->unit));
            $sheet->setCellValue('G' . $row, $item->reorder_level ?? 0);
            $sheet->setCellValue('H' . $row, strtoupper($item->supplier ?? 'DBM')); // Default supplier if null
            $sheet->setCellValue('I' . $row, $item->location ?? 'Stock Room'); // Default location if null
            
            // Style data cells
            $sheet->getStyle('A' . $row . ':I' . $row)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);
            
            $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('F' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('G' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            $row++;
            $count++;
        }
        
        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(10); // Item No
        $sheet->getColumnDimension('B')->setWidth(25); // Item Name
        $sheet->getColumnDimension('C')->setWidth(20); // Category
        $sheet->getColumnDimension('D')->setWidth(40); // Description
        $sheet->getColumnDimension('E')->setWidth(15); // Quantity
        $sheet->getColumnDimension('F')->setWidth(10); // Unit
        $sheet->getColumnDimension('G')->setWidth(15); // Reorder Level
        $sheet->getColumnDimension('H')->setWidth(20); // Supplier
        $sheet->getColumnDimension('I')->setWidth(15); // Location
        
        // Set row heights
        $sheet->getRowDimension(10)->setRowHeight(30); // Header band
        $sheet->getRowDimension(12)->setRowHeight(20); // Column headers
        
        // Create Excel file
        $writer = new Xlsx($spreadsheet);
        $fileName = 'office_supplies_inventory_' . date('Y-m-d') . '.xlsx';
        $tempPath = storage_path('app/public/' . $fileName);
        
        // Save file to storage
        $writer->save($tempPath);
        
        // Return download response
        return response()->download($tempPath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
