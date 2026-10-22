<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;
use RuntimeException;

class InventoryService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Re-check and lock variant stock within an active transaction
     */
    public function lockAndVerifyVariantStock(int $variantId, int $requestedQuantity): array
    {
        $stmt = $this->db->prepare(
            "SELECT pv.id, pv.product_id, pv.sku, pv.color_name, pv.size, pv.price_override, 
                    pv.stock_quantity, pv.is_active, p.name AS product_name, p.base_price
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             WHERE pv.id = :id AND pv.is_active = 1
             FOR UPDATE"
        );
        $stmt->execute([':id' => $variantId]);
        $variant = $stmt->fetch();

        if (!$variant) {
            throw new RuntimeException("Selected product variant does not exist or has been disabled.");
        }

        if ((int)$variant['stock_quantity'] < $requestedQuantity) {
            throw new RuntimeException(
                "Insufficient stock for {$variant['product_name']} ({$variant['color_name']} / {$variant['size']}). Available: {$variant['stock_quantity']}."
            );
        }

        return $variant;
    }

    /**
     * Decrement variant stock
     */
    public function decrementVariantStock(int $variantId, int $quantity): void
    {
        $stmt = $this->db->prepare(
            "UPDATE product_variants 
             SET stock_quantity = stock_quantity - :qty 
             WHERE id = :id AND stock_quantity >= :qty_check"
        );
        $stmt->execute([
            ':qty' => $quantity,
            ':id' => $variantId,
            ':qty_check' => $quantity
        ]);

        if ($stmt->rowCount() === 0) {
            throw new RuntimeException("Concurrent checkout race: stock was depleted.");
        }
    }

    /**
     * Restore stock upon order cancellation
     */
    public function restoreVariantStock(int $variantId, int $quantity): void
    {
        $stmt = $this->db->prepare(
            "UPDATE product_variants 
             SET stock_quantity = stock_quantity + :qty 
             WHERE id = :id"
        );
        $stmt->execute([
            ':qty' => $quantity,
            ':id' => $variantId
        ]);
    }
}
