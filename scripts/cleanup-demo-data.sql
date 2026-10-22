-- ============================================================================
-- ThreadCraft V2 — Safe Production Demo Data Cleanup Script (MySQL / MariaDB)
-- File: scripts/cleanup-demo-data.sql
-- ============================================================================
--
-- MANDATORY PRE-CLEANUP BACKUP INSTRUCTIONS:
-- Before executing this cleanup script in production or staging, ALWAYS take a
-- full consistent database backup:
--
-- Option A — CLI (SSH / Terminal via mysqldump):
--   mysqldump -u <db_username> -p --single-transaction --routines --triggers \
--     --events threadcraft_v2 > backup_threadcraft_v2_pre_cleanup_$(date +%F_%H-%M-%S).sql
--
-- Option B — cPanel Shared Hosting Backup:
--   1. Log in to cPanel -> Files -> Backup Wizard -> Backup -> Partial Backup.
--   2. Select "MySQL Databases" and click "threadcraft_v2" to download the
--      compressed .sql.gz backup archive to your local workstation.
--   3. Verify the downloaded .sql.gz archive is non-empty before proceeding.
--
-- SAFETY GUARANTEES:
-- 1. Wrapped in an explicit ACID transaction (START TRANSACTION ... COMMIT).
-- 2. Targets ONLY known seed/demo identifiers (emails, UUIDs, order numbers,
--    payment claim TrxIDs, and seed review IDs).
-- 3. Safeguard: Never deletes any customer account that has placed a real
--    non-demo order, and never deletes the provisioned bootstrap admin.
-- ============================================================================

START TRANSACTION;

-- 1. Delete known fake payment claims & status history attached ONLY to known demo orders
DELETE FROM `payments`
WHERE `transaction_id` IN ('BK9A77209X', 'BK7J90123M', 'NG8K2190')
   OR `order_id` IN (
     SELECT `id` FROM (
       SELECT `id` FROM `orders`
       WHERE `order_number` IN ('ORD-2026-7841', 'ORD-2026-8109', 'ORD-2026-9214')
          OR `uuid` IN ('ord-1001', 'ord-1002', 'ord-1003')
     ) AS `demo_orders_sub`
   );

DELETE FROM `order_status_history`
WHERE `order_id` IN (
  SELECT `id` FROM (
    SELECT `id` FROM `orders`
    WHERE `order_number` IN ('ORD-2026-7841', 'ORD-2026-8109', 'ORD-2026-9214')
       OR `uuid` IN ('ord-1001', 'ord-1002', 'ord-1003')
  ) AS `demo_orders_sub`
);

DELETE FROM `order_items`
WHERE `order_id` IN (
  SELECT `id` FROM (
    SELECT `id` FROM `orders`
    WHERE `order_number` IN ('ORD-2026-7841', 'ORD-2026-8109', 'ORD-2026-9214')
       OR `uuid` IN ('ord-1001', 'ord-1002', 'ord-1003')
  ) AS `demo_orders_sub`
);

-- 2. Delete ONLY the 3 identifiable fake seed orders
DELETE FROM `orders`
WHERE `order_number` IN ('ORD-2026-7841', 'ORD-2026-8109', 'ORD-2026-9214')
   OR `uuid` IN ('ord-1001', 'ord-1002', 'ord-1003');

-- 3. Delete identifiable demo loyalty transactions
DELETE FROM `loyalty_transactions`
WHERE `uuid` IN ('ltx-1', 'ltx-2')
   OR `order_id` IN ('ord-1001', 'ord-1002', 'ord-1003');

-- 4. Delete identifiable demo product reviews
DELETE FROM `product_reviews`
WHERE `uuid` IN ('rev-1', 'rev-2', 'rev-3', 'rev-4', 'rev-5', 'rev-6', 'rev-7')
   OR `user_id` IN ('user-customer-1', 'user-cust-2', 'user-cust-3', 'user-cust-4', 'user-cust-5', 'user-cust-6');

-- 5. Delete identifiable demo webhook & email logs
DELETE FROM `payment_webhook_logs`
WHERE `uuid` = 'wh-1001'
   OR (`transaction_id` = 'BK98A4201X' AND `order_reference` = 'ORD-2026-1042');

DELETE FROM `email_logs`
WHERE `uuid` IN ('eml-101', 'eml-102', 'eml-103')
   OR `related_order_id` IN ('ord-1001', 'ord-1002', 'ord-1003');

-- 6. Delete identifiable demo audit logs
DELETE FROM `admin_audit_logs`
WHERE `uuid` IN ('audit-1', 'audit-2')
   OR (`actor_name` = 'Tanvir Ahmed' AND `entity_id` = 'ord-1001');

-- 7. Delete addresses belonging to identifiable demo users (ONLY if user has zero real orders)
DELETE FROM `user_addresses`
WHERE `user_id` IN (
  SELECT `id` FROM (
    SELECT `u`.`id`
    FROM `users` `u`
    LEFT JOIN `orders` `o` ON `o`.`user_id` = `u`.`id`
    WHERE (
      `u`.`email` IN (
        'admin@threadcraft.com',
        'customer@threadcraft.com',
        'nusrat.jahan@example.com',
        'rafiq.islam@example.com'
      )
      OR `u`.`uuid` IN (
        'user-admin',
        'user-customer-1',
        'user-customer-2',
        'user-customer-3'
      )
    )
    GROUP BY `u`.`id`
    HAVING COUNT(`o`.`id`) = 0
  ) AS `safe_demo_users`
);

-- 8. Delete identifiable demo user accounts ONLY if they have zero remaining real orders
DELETE FROM `users`
WHERE `id` IN (
  SELECT `id` FROM (
    SELECT `u`.`id`
    FROM `users` `u`
    LEFT JOIN `orders` `o` ON `o`.`user_id` = `u`.`id`
    WHERE (
      `u`.`email` IN (
        'admin@threadcraft.com',
        'customer@threadcraft.com',
        'nusrat.jahan@example.com',
        'rafiq.islam@example.com'
      )
      OR `u`.`uuid` IN (
        'user-admin',
        'user-customer-1',
        'user-customer-2',
        'user-customer-3'
      )
    )
    GROUP BY `u`.`id`
    HAVING COUNT(`o`.`id`) = 0
  ) AS `safe_demo_users_to_delete`
);

COMMIT;
