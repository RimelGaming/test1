/**
 * ThreadCraft V2 — Safe Production Demo Data Cleanup Runner (Node.js)
 * File: scripts/cleanup-demo-data.js
 * Usage: npm run cleanup:demo
 *
 * ============================================================================
 * MANDATORY PRE-CLEANUP DATABASE BACKUP COMMANDS:
 *
 * 1. MySQL / MariaDB via mysqldump (SSH / CLI):
 *    mysqldump -u <db_username> -p --single-transaction --routines --triggers \
 *      --events threadcraft_v2 > backup_threadcraft_v2_pre_cleanup_$(date +%F_%H-%M-%S).sql
 *
 * 2. cPanel Shared Hosting Backup Wizard:
 *    cPanel -> Backup Wizard -> Backup -> Partial Backup -> MySQL Databases ->
 *    Click "threadcraft_v2" to download threadcraft_v2.sql.gz before running cleanup.
 *
 * 3. Local SQLite Backup (Development):
 *    cp database/threadcraft_v2.sqlite database/threadcraft_v2_backup_$(date +%F_%H-%M-%S).sqlite
 * ============================================================================
 *
 * Safeguards:
 * - Runs inside an atomic database transaction (ROLLBACK on any error).
 * - Deletes ONLY identifiable demo/seed records.
 * - Verifies that no real customer account with real orders is ever deleted.
 * - Never touches the provisioned bootstrap admin (process.env.INITIAL_ADMIN_EMAIL).
 */

import dotenv from 'dotenv';
import { getDb } from '../server/db';

dotenv.config();

const DEMO_EMAILS = [
  'admin@threadcraft.com',
  'customer@threadcraft.com',
  'nusrat.jahan@example.com',
  'rafiq.islam@example.com',
];

const DEMO_USER_UUIDS = [
  'user-admin',
  'user-customer-1',
  'user-customer-2',
  'user-customer-3',
];

const DEMO_ORDER_NUMBERS = [
  'ORD-2026-7841',
  'ORD-2026-8109',
  'ORD-2026-9214',
];

const DEMO_ORDER_UUIDS = ['ord-1001', 'ord-1002', 'ord-1003'];

const DEMO_TRX_IDS = ['BK9A77209X', 'BK7J90123M', 'NG8K2190'];

const DEMO_REVIEW_UUIDS = ['rev-1', 'rev-2', 'rev-3', 'rev-4', 'rev-5', 'rev-6', 'rev-7'];

export async function runDemoDataCleanup() {
  const db = await getDb();
  const initialAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase();

  const summary = {
    deletedOrders: 0,
    deletedPayments: 0,
    deletedReviews: 0,
    deletedWebhookLogs: 0,
    deletedEmailLogs: 0,
    deletedAuditLogs: 0,
    deletedUsers: 0,
  };

  await db.transaction(async () => {
    // 1. Find demo orders matching exact seed order numbers or UUIDs
    const demoOrders = await db.query(
      `SELECT id, order_number FROM orders
       WHERE order_number IN (?, ?, ?) OR uuid IN (?, ?, ?)`,
      [...DEMO_ORDER_NUMBERS, ...DEMO_ORDER_UUIDS]
    );

    for (const ord of demoOrders) {
      await db.execute('DELETE FROM payments WHERE order_id = ?', [ord.id]);
      await db.execute('DELETE FROM order_status_history WHERE order_id = ?', [ord.id]);
      await db.execute('DELETE FROM order_items WHERE order_id = ?', [ord.id]);
      const delOrd = await db.execute('DELETE FROM orders WHERE id = ?', [ord.id]);
      summary.deletedOrders += delOrd.affectedRows;
    }

    // 2. Delete any remaining demo payment claims by known demo TrxID
    const delClaims = await db.execute(
      `DELETE FROM payments WHERE transaction_id IN (?, ?, ?)`,
      DEMO_TRX_IDS
    );
    summary.deletedPayments += delClaims.affectedRows;

    // 3. Delete known demo loyalty transactions
    await db.execute(
      `DELETE FROM loyalty_transactions WHERE uuid IN (?, ?) OR order_id IN (?, ?, ?)`,
      ['ltx-1', 'ltx-2', ...DEMO_ORDER_UUIDS]
    );

    // 4. Delete known demo reviews
    const delReviews = await db.execute(
      `DELETE FROM product_reviews WHERE uuid IN (?, ?, ?, ?, ?, ?, ?)`,
      DEMO_REVIEW_UUIDS
    );
    summary.deletedReviews += delReviews.affectedRows;

    // 5. Delete known demo webhook & email logs
    const delWebhooks = await db.execute(
      `DELETE FROM payment_webhook_logs WHERE uuid = ? OR (transaction_id = ? AND order_reference = ?)`,
      ['wh-1001', 'BK98A4201X', 'ORD-2026-1042']
    );
    summary.deletedWebhookLogs += delWebhooks.affectedRows;

    const delEmails = await db.execute(
      `DELETE FROM email_logs WHERE uuid IN (?, ?, ?) OR related_order_id IN (?, ?, ?)`,
      ['eml-101', 'eml-102', 'eml-103', ...DEMO_ORDER_UUIDS]
    );
    summary.deletedEmailLogs += delEmails.affectedRows;

    // 6. Delete known demo audit logs
    const delAudits = await db.execute(
      `DELETE FROM admin_audit_logs WHERE uuid IN (?, ?)`,
      ['audit-1', 'audit-2']
    );
    summary.deletedAuditLogs += delAudits.affectedRows;

    // 7. Identify candidate demo users, excluding INITIAL_ADMIN_EMAIL and any user with real orders
    const candidateUsers = await db.query(
      `SELECT id, email, uuid FROM users
       WHERE (email IN (?, ?, ?, ?) OR uuid IN (?, ?, ?, ?))
         AND LOWER(email) != ?`,
      [...DEMO_EMAILS, ...DEMO_USER_UUIDS, initialAdminEmail]
    );

    for (const u of candidateUsers) {
      const realOrderCheck = await db.get(
        'SELECT COUNT(*) as cnt FROM orders WHERE user_id = ?',
        [u.id]
      );
      if (Number(realOrderCheck?.cnt ?? 0) === 0) {
        await db.execute('DELETE FROM user_addresses WHERE user_id = ?', [u.id]);
        await db.execute('DELETE FROM user_sessions WHERE user_id = ?', [u.id]);
        const delU = await db.execute('DELETE FROM users WHERE id = ?', [u.id]);
        summary.deletedUsers += delU.affectedRows;
      } else {
        console.warn(
          `[cleanup:demo] Safeguard triggered: Skipping user ${u.email} because they have ${realOrderCheck?.cnt} real order(s).`
        );
      }
    }
  });

  console.log('[cleanup:demo] Transaction committed successfully. Summary:', summary);
  return summary;
}

runDemoDataCleanup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[cleanup:demo] Transaction rolled back due to error:', err);
    process.exit(1);
  });
