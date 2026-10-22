<?php
declare(strict_types=1);

/**
 * ThreadCraft V2 — Database Connection Manager
 * PDO with Prepared Statements for MySQL 8.0+ / MariaDB 10.4+
 */

namespace App\Config;

use PDO;
use PDOException;
use RuntimeException;

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = getenv('DB_HOST') ?: 'localhost';
            $port = getenv('DB_PORT') ?: '3306';
            $dbname = getenv('DB_DATABASE') ?: 'threadcraft_v2';
            $user = getenv('DB_USERNAME') ?: 'root';
            $pass = getenv('DB_PASSWORD') ?: '';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false, // Always use native prepared statements
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                // Never expose raw database credentials or stack trace to client
                error_log("Database connection error: " . $e->getMessage());
                throw new RuntimeException("Database service temporarily unavailable. Please try again shortly.");
            }
        }

        return self::$instance;
    }
}
