-- =====================================================================
-- ThreadCraft V2 — T-Shirt E-Commerce Database Schema Migration
-- Target: MySQL 8.0+ / MariaDB 10.4+ (Compatible with shared cPanel hosting)
-- Engine: InnoDB, Charset: utf8mb4_unicode_ci
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users table (Customer & Admin Accounts)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `status` ENUM('active', 'suspended', 'archived') NOT NULL DEFAULT 'active',
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `loyalty_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1b. User Sessions table (Server-side HTTP-only session & CSRF state)
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `session_id` VARCHAR(128) PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `csrf_token` VARCHAR(128) NOT NULL,
  `ip_address` VARCHAR(64) NULL,
  `user_agent` VARCHAR(255) NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_sessions_user` (`user_id`),
  INDEX `idx_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User addresses
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `label` VARCHAR(60) NOT NULL DEFAULT 'Home',
  `recipient_name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `address_line` TEXT NOT NULL,
  `district` VARCHAR(60) NOT NULL,
  `area_id` VARCHAR(60) NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(140) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `image_url` VARCHAR(255) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Products
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `category_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `description` LONGTEXT NOT NULL,
  `short_description` VARCHAR(300) NULL,
  `base_price` DECIMAL(10,2) NOT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('published', 'draft', 'archived') NOT NULL DEFAULT 'published',
  `fabric_weight` VARCHAR(100) NOT NULL DEFAULT '240 GSM 100% Combed Cotton',
  `fit_type` VARCHAR(60) NOT NULL DEFAULT 'Boxy Heavyweight',
  `care_instructions` TEXT NULL,
  `seo_title` VARCHAR(200) NULL,
  `seo_description` VARCHAR(300) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  INDEX `idx_products_status` (`status`),
  INDEX `idx_products_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Product Variants (Color + Size combo with unique SKU and independent stock)
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `product_id` INT UNSIGNED NOT NULL,
  `color_name` VARCHAR(60) NOT NULL,
  `color_hex` VARCHAR(10) NOT NULL,
  `size` ENUM('XS', 'S', 'M', 'L', 'XL', '2XL') NOT NULL,
  `sku` VARCHAR(60) NOT NULL UNIQUE,
  `price_override` DECIMAL(10,2) NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_product_color_size` (`product_id`, `color_name`, `size`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_variants_sku` (`sku`),
  INDEX `idx_variants_stock` (`stock_quantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Product Variant Images (Gallery per color/variant)
CREATE TABLE IF NOT EXISTS `product_variant_images` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `product_id` INT UNSIGNED NOT NULL,
  `color_name` VARCHAR(60) NOT NULL,
  `image_url` LONGTEXT NOT NULL,
  `alt_text` VARCHAR(200) NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_images_color` (`product_id`, `color_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Delivery Zones & Areas
CREATE TABLE IF NOT EXISTS `delivery_zones` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `fee` DECIMAL(10,2) NOT NULL,
  `estimated_delivery_time` VARCHAR(60) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_areas` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `zone_id` INT UNSIGNED NOT NULL,
  `district_name` VARCHAR(60) NOT NULL,
  `area_name` VARCHAR(120) NOT NULL,
  CONSTRAINT `fk_areas_zone` FOREIGN KEY (`zone_id`) REFERENCES `delivery_zones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Payment Methods (Manual verification only - NO gateway APIs)
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(40) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('cod', 'bkash', 'nagad', 'rocket', 'bank') NOT NULL,
  `recipient_number` VARCHAR(60) NOT NULL,
  `account_type` VARCHAR(40) NOT NULL DEFAULT 'personal',
  `instructions` TEXT NOT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Coupons
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `max_discount_amount` DECIMAL(10,2) NULL,
  `usage_limit_global` INT NOT NULL DEFAULT 100,
  `usage_limit_per_user` INT NOT NULL DEFAULT 1,
  `used_count` INT NOT NULL DEFAULT 0,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Orders (Historical immutable snapshots)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(60) NULL UNIQUE,
  `order_number` VARCHAR(40) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_email` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `shipping_address_line` TEXT NOT NULL,
  `shipping_district` VARCHAR(60) NOT NULL,
  `shipping_area` VARCHAR(120) NOT NULL,
  `delivery_zone_id` VARCHAR(60) NULL,
  `delivery_zone_name` VARCHAR(120) NOT NULL,
  `delivery_fee` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `coupon_code` VARCHAR(50) NULL,
  `coupon_discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `loyalty_points_used` INT UNSIGNED NOT NULL DEFAULT 0,
  `loyalty_discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(10,2) NOT NULL,
  `order_status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('unpaid', 'awaiting_verification', 'verified', 'rejected', 'refunded') NOT NULL DEFAULT 'unpaid',
  `payment_method_id` VARCHAR(60) NULL,
  `payment_method_name` VARCHAR(100) NOT NULL,
  `payment_method_type` VARCHAR(40) NULL DEFAULT 'cod',
  `payment_recipient_number` VARCHAR(60) NULL,
  `payment_account_type` VARCHAR(40) NULL,
  `carrier_name` VARCHAR(100) NULL,
  `tracking_number` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_orders_status` (`order_status`),
  INDEX `idx_orders_payment_status` (`payment_status`),
  INDEX `idx_orders_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Order Items (Preserving exact product & variant snapshots)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` VARCHAR(60) NULL,
  `variant_id` VARCHAR(60) NULL,
  `product_name` VARCHAR(180) NOT NULL,
  `sku` VARCHAR(60) NOT NULL,
  `color_name` VARCHAR(60) NOT NULL,
  `size` VARCHAR(10) NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL,
  `line_total` DECIMAL(10,2) NOT NULL,
  `image_url` LONGTEXT NULL,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Payments & Manual Claims (Admin verification audit trail)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(60) NULL UNIQUE,
  `order_id` INT UNSIGNED NOT NULL,
  `payment_method_id` VARCHAR(60) NULL,
  `payment_method_name` VARCHAR(100) NOT NULL,
  `sender_phone` VARCHAR(30) NULL,
  `transaction_id` VARCHAR(100) NULL,
  `amount_claimed` DECIMAL(10,2) NOT NULL,
  `customer_notes` TEXT NULL,
  `status` ENUM('awaiting_verification', 'verified', 'rejected', 'refunded') NOT NULL DEFAULT 'awaiting_verification',
  `verified_by` VARCHAR(120) NULL,
  `verified_at` DATETIME NULL,
  `rejection_reason` TEXT NULL,
  `admin_notes` TEXT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_payments_trx` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Order Status History
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(60) NULL,
  `order_id` INT UNSIGNED NOT NULL,
  `from_status` VARCHAR(40) NOT NULL,
  `to_status` VARCHAR(40) NOT NULL,
  `note` TEXT NULL,
  `actor` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Loyalty Transactions Ledger
CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(60) NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `order_id` VARCHAR(60) NULL,
  `points_delta` INT NOT NULL,
  `balance_after` INT UNSIGNED NOT NULL,
  `type` ENUM('earn', 'redeem', 'admin_adjustment', 'bonus', 'refund_reversal') NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_loyalty_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Admin Audit Logs
CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(60) NULL UNIQUE,
  `actor_name` VARCHAR(120) NOT NULL,
  `actor_role` VARCHAR(40) NOT NULL DEFAULT 'admin',
  `action` VARCHAR(60) NOT NULL,
  `entity_type` VARCHAR(60) NOT NULL,
  `entity_id` VARCHAR(60) NOT NULL,
  `details` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Site Settings (Key-Value Store for live customization)
CREATE TABLE IF NOT EXISTS `site_settings` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. News & Blog Posts
CREATE TABLE IF NOT EXISTS `news_posts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL UNIQUE,
  `excerpt` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `image_url` LONGTEXT NULL,
  `author` VARCHAR(100) NOT NULL,
  `category` VARCHAR(60) NOT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `published_at` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Static Pages
CREATE TABLE IF NOT EXISTS `pages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code_id` VARCHAR(60) NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `title` VARCHAR(160) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Product Reviews
CREATE TABLE IF NOT EXISTS `product_reviews` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(60) NOT NULL UNIQUE,
  `product_id` VARCHAR(60) NOT NULL,
  `user_id` VARCHAR(60) NOT NULL,
  `user_name` VARCHAR(120) NOT NULL,
  `user_email` VARCHAR(191) NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `title` VARCHAR(200) NULL,
  `comment` TEXT NOT NULL,
  `verified_purchase` TINYINT(1) NOT NULL DEFAULT 0,
  `helpful_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Payment Webhook Logs
CREATE TABLE IF NOT EXISTS `payment_webhook_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(60) NOT NULL UNIQUE,
  `gateway` VARCHAR(40) NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL,
  `sender_phone` VARCHAR(30) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `order_reference` VARCHAR(60) NULL,
  `matched_order_id` VARCHAR(60) NULL,
  `matched_order_number` VARCHAR(60) NULL,
  `status` VARCHAR(40) NOT NULL,
  `signature_verified` TINYINT(1) NOT NULL DEFAULT 1,
  `processed_note` TEXT NOT NULL,
  `raw_payload` LONGTEXT NOT NULL,
  `received_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Email Outbox Logs
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(60) NOT NULL UNIQUE,
  `to_email` VARCHAR(191) NOT NULL,
  `to_name` VARCHAR(120) NOT NULL,
  `from_email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `html_content` LONGTEXT NOT NULL,
  `type` VARCHAR(40) NOT NULL,
  `related_order_id` VARCHAR(60) NULL,
  `status` ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  `smtp_host_used` VARCHAR(191) NOT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
