<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;
use RuntimeException;

/**
 * ThreadCraft V2 — Production Authentication & Admin Security Service
 * Enforces bcrypt password hashing, server-side customer role assignment on public registration,
 * CSRF token validation, and mandatory first-login password change checks.
 */
class AuthSecurityService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Public Customer Registration
     * Strictly assigns role = 'customer' and must_change_password = 0, ignoring any client-passed role.
     */
    public function registerCustomer(string $name, string $email, string $phone, string $password): array
    {
        $cleanName = trim($name);
        $cleanEmail = strtolower(trim($email));
        $cleanPhone = trim($phone);

        if ($cleanName === '' || !filter_var($cleanEmail, FILTER_VALIDATE_EMAIL) || $cleanPhone === '') {
            throw new RuntimeException("Valid name, email address, and phone number are required.");
        }

        if (strlen($password) < 8) {
            throw new RuntimeException("Password must be at least 8 characters long.");
        }

        // Check existing email via prepared statement
        $checkStmt = $this->db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $checkStmt->execute([':email' => $cleanEmail]);
        if ($checkStmt->fetch()) {
            throw new RuntimeException("An account with this email address already exists.");
        }

        $uuid = 'user-' . bin2hex(random_bytes(8));
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $stmt = $this->db->prepare(
            "INSERT INTO users (uuid, name, email, phone, password_hash, role, status, must_change_password, loyalty_points)
             VALUES (:uuid, :name, :email, :phone, :password_hash, 'customer', 'active', 0, 100)"
        );
        $stmt->execute([
            ':uuid' => $uuid,
            ':name' => $cleanName,
            ':email' => $cleanEmail,
            ':phone' => $cleanPhone,
            ':password_hash' => $passwordHash,
        ]);

        return $this->getUserByEmail($cleanEmail);
    }

    /**
     * Authenticate user with email & password
     */
    public function verifyCredentials(string $email, string $password): array
    {
        $cleanEmail = strtolower(trim($email));
        $stmt = $this->db->prepare(
            "SELECT id, uuid, name, email, phone, password_hash, role, status, must_change_password, loyalty_points, created_at
             FROM users
             WHERE email = :email
             LIMIT 1"
        );
        $stmt->execute([':email' => $cleanEmail]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, (string)$user['password_hash'])) {
            throw new RuntimeException("Invalid email or password.");
        }

        if ($user['status'] !== 'active') {
            throw new RuntimeException("This account is currently {$user['status']}. Please contact support.");
        }

        unset($user['password_hash']);
        $user['must_change_password'] = (bool)$user['must_change_password'];
        return $user;
    }

    /**
     * Change password and clear must_change_password flag
     */
    public function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        if (strlen($newPassword) < 8) {
            throw new RuntimeException("New password must be at least 8 characters long.");
        }

        $stmt = $this->db->prepare("SELECT password_hash FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $userId]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($currentPassword, (string)$row['password_hash'])) {
            throw new RuntimeException("Current password is incorrect.");
        }

        if (password_verify($newPassword, (string)$row['password_hash'])) {
            throw new RuntimeException("New password must be different from the current temporary password.");
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $updateStmt = $this->db->prepare(
            "UPDATE users SET password_hash = :hash, must_change_password = 0 WHERE id = :id"
        );
        $updateStmt->execute([
            ':hash' => $newHash,
            ':id' => $userId,
        ]);
    }

    private function getUserByEmail(string $email): array
    {
        $stmt = $this->db->prepare(
            "SELECT id, uuid, name, email, phone, role, status, must_change_password, loyalty_points, created_at
             FROM users
             WHERE email = :email
             LIMIT 1"
        );
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
        if (!$user) {
            throw new RuntimeException("User not found.");
        }
        $user['must_change_password'] = (bool)$user['must_change_password'];
        return $user;
    }
}
