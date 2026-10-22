<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;
use RuntimeException;

class PaymentVerificationService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Submit a manual mobile payment claim (bKash, Nagad, Rocket)
     */
    public function submitClaim(int $orderId, string $methodName, string $senderPhone, string $trxId, float $amount, string $notes): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO payments (order_id, payment_method_name, sender_phone, transaction_id, amount_claimed, customer_notes, status)
             VALUES (:order_id, :method_name, :sender_phone, :trx_id, :amount, :notes, 'awaiting_verification')"
        );
        $stmt->execute([
            ':order_id' => $orderId,
            ':method_name' => $methodName,
            ':sender_phone' => $senderPhone,
            ':trx_id' => strtoupper(trim($trxId)),
            ':amount' => $amount,
            ':notes' => $notes
        ]);

        // Update order payment status
        $updateOrder = $this->db->prepare(
            "UPDATE orders SET payment_status = 'awaiting_verification' WHERE id = :order_id"
        );
        $updateOrder->execute([':order_id' => $orderId]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Admin manually approves payment claim after verifying against statement
     */
    public function verifyClaim(int $orderId, string $adminName, string $adminNotes): void
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "UPDATE payments 
                 SET status = 'verified', verified_by = :admin, verified_at = NOW(), admin_notes = :notes
                 WHERE order_id = :order_id AND status = 'awaiting_verification'"
            );
            $stmt->execute([
                ':admin' => $adminName,
                ':notes' => $adminNotes,
                ':order_id' => $orderId
            ]);

            $orderStmt = $this->db->prepare(
                "UPDATE orders 
                 SET payment_status = 'verified', order_status = IF(order_status = 'pending', 'processing', order_status)
                 WHERE id = :order_id"
            );
            $orderStmt->execute([':order_id' => $orderId]);

            // Add history item
            $histStmt = $this->db->prepare(
                "INSERT INTO order_status_history (order_id, from_status, to_status, note, actor)
                 VALUES (:order_id, 'pending', 'processing', :note, :actor)"
            );
            $histStmt->execute([
                ':order_id' => $orderId,
                ':note' => "Payment verified by Admin {$adminName}. Notes: {$adminNotes}",
                ':actor' => $adminName
            ]);

            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw new RuntimeException("Failed to verify payment claim: " . $e->getMessage());
        }
    }

    /**
     * Admin rejects payment claim with required reason
     */
    public function rejectClaim(int $orderId, string $adminName, string $rejectionReason): void
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "UPDATE payments 
                 SET status = 'rejected', rejection_reason = :reason, admin_notes = :notes
                 WHERE order_id = :order_id"
            );
            $stmt->execute([
                ':reason' => $rejectionReason,
                ':notes' => "Rejected by {$adminName}: {$rejectionReason}",
                ':order_id' => $orderId
            ]);

            $orderStmt = $this->db->prepare(
                "UPDATE orders SET payment_status = 'rejected' WHERE id = :order_id"
            );
            $orderStmt->execute([':order_id' => $orderId]);

            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw new RuntimeException("Failed to reject payment claim: " . $e->getMessage());
        }
    }
}
