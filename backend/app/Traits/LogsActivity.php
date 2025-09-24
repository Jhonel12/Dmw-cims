<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    /**
     * Log an activity
     *
     * @param string $action The action performed (create, update, delete, etc.)
     * @param string $entityType The type of entity (Item, Category, User, etc.)
     * @param int|null $entityId The ID of the entity (can be null for bulk actions)
     * @param string $details Details about the action
     * @return ActivityLog
     */
    protected function logActivity(string $action, string $entityType, ?int $entityId = null, string $details = ''): ?ActivityLog
    {
        // Only log activity if there is an authenticated user
        if (!Auth::check()) {
            return null;
        }

        return ActivityLog::create([
            'user_id' => Auth::id(),
            // Include division_id for easier filtering in reports
            'division_id' => optional(Auth::user())->division_id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }

    /**
     * Log a creation activity
     *
     * @param string $entityType The type of entity created
     * @param int $entityId The ID of the created entity
     * @param string $details Optional details about the creation
     * @return ActivityLog|null
     */
    protected function logCreation(string $entityType, int $entityId, string $details = ''): ?ActivityLog
    {
        return $this->logActivity('create', $entityType, $entityId, $details);
    }

    /**
     * Log an update activity
     *
     * @param string $entityType The type of entity updated
     * @param int $entityId The ID of the updated entity
     * @param string $details Optional details about what was updated
     * @return ActivityLog|null
     */
    protected function logUpdate(string $entityType, int $entityId, string $details = ''): ?ActivityLog
    {
        return $this->logActivity('update', $entityType, $entityId, $details);
    }

    /**
     * Log a deletion activity
     *
     * @param string $entityType The type of entity deleted
     * @param int $entityId The ID of the deleted entity
     * @param string $details Optional details about the deletion
     * @return ActivityLog|null
     */
    protected function logDeletion(string $entityType, int $entityId, string $details = ''): ?ActivityLog
    {
        return $this->logActivity('delete', $entityType, $entityId, $details);
    }

    /**
     * Log a bulk action
     *
     * @param string $action The action performed (create, update, delete, import, export)
     * @param string $entityType The type of entity affected
     * @param string $details Details about the bulk action
     * @return ActivityLog|null
     */
    protected function logBulkAction(string $action, string $entityType, string $details): ?ActivityLog
    {
        return $this->logActivity($action, $entityType, null, $details);
    }

    /**
     * Log quantity change for an item
     *
     * @param int $itemId The ID of the item
     * @param string $itemName The name of the item
     * @param int $oldQuantity The previous quantity
     * @param int $newQuantity The new quantity
     * @param string $reason The reason for the change (e.g., 'stock adjustment', 'damage', 'restock')
     * @return ActivityLog|null
     */
    protected function logQuantityChange(int $itemId, string $itemName, int $oldQuantity, int $newQuantity, string $reason = 'quantity adjustment'): ?ActivityLog
    {
        $change = $newQuantity - $oldQuantity;
        $changeType = $change > 0 ? 'Added' : 'Removed';
        $changeAmount = abs($change);
        
        $details = "{$changeType} quantity {$changeAmount} of item '{$itemName}' (from {$oldQuantity} to {$newQuantity}) - {$reason}";
        
        return $this->logActivity('quantity_change', 'Item', $itemId, $details);
    }

    /**
     * Log item creation with detailed information
     *
     * @param int $itemId The ID of the created item
     * @param string $itemName The name of the item
     * @param int $quantity The initial quantity
     * @param string $category The category name
     * @return ActivityLog|null
     */
    protected function logItemCreation(int $itemId, string $itemName, int $quantity, string $category = ''): ?ActivityLog
    {
        $details = "Created item '{$itemName}' with initial quantity {$quantity}";
        if ($category) {
            $details .= " in category '{$category}'";
        }
        
        return $this->logActivity('create', 'Item', $itemId, $details);
    }

    /**
     * Log item update with detailed information
     *
     * @param int $itemId The ID of the updated item
     * @param string $itemName The name of the item
     * @param array $changes Array of changes made (field => [old, new])
     * @return ActivityLog|null
     */
    protected function logItemUpdate(int $itemId, string $itemName, array $changes): ?ActivityLog
    {
        $changeDetails = [];
        
        foreach ($changes as $field => $change) {
            if ($field === 'quantity_on_hand') {
                $oldQty = $change[0] ?? 0;
                $newQty = $change[1] ?? 0;
                $changeAmount = $newQty - $oldQty;
                $changeType = $changeAmount > 0 ? 'increased' : 'decreased';
                $changeDetails[] = "quantity {$changeType} from {$oldQty} to {$newQty}";
            } else {
                $oldValue = $change[0] ?? 'empty';
                $newValue = $change[1] ?? 'empty';
                $changeDetails[] = "{$field} changed from '{$oldValue}' to '{$newValue}'";
            }
        }
        
        $details = "Updated item '{$itemName}': " . implode(', ', $changeDetails);
        
        return $this->logActivity('update', 'Item', $itemId, $details);
    }

    /**
     * Log damage report with quantity details
     *
     * @param int $itemId The ID of the damaged item
     * @param string $itemName The name of the item
     * @param int $damagedQuantity The quantity damaged
     * @param int $remainingQuantity The remaining quantity
     * @param string $damageType The type of damage
     * @return ActivityLog|null
     */
    protected function logDamageReport(int $itemId, string $itemName, int $damagedQuantity, int $remainingQuantity, string $damageType): ?ActivityLog
    {
        $details = "Marked {$damagedQuantity} units of '{$itemName}' as damaged ({$damageType}). Remaining quantity: {$remainingQuantity}";
        
        return $this->logActivity('damage', 'Item', $itemId, $details);
    }

    /**
     * Log stock adjustment
     *
     * @param int $itemId The ID of the item
     * @param string $itemName The name of the item
     * @param int $oldQuantity The previous quantity
     * @param int $newQuantity The new quantity
     * @param string $adjustmentType The type of adjustment (restock, adjustment, correction)
     * @param string $notes Additional notes
     * @return ActivityLog|null
     */
    protected function logStockAdjustment(int $itemId, string $itemName, int $oldQuantity, int $newQuantity, string $adjustmentType = 'adjustment', string $notes = ''): ?ActivityLog
    {
        $change = $newQuantity - $oldQuantity;
        $changeType = $change > 0 ? 'increased' : 'decreased';
        $changeAmount = abs($change);
        
        $details = "Stock {$adjustmentType}: {$changeType} quantity by {$changeAmount} for '{$itemName}' (from {$oldQuantity} to {$newQuantity})";
        if ($notes) {
            $details .= " - {$notes}";
        }
        
        return $this->logActivity('stock_adjustment', 'Item', $itemId, $details);
    }
}
