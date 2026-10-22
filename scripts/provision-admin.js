/**
 * ThreadCraft V2 — Idempotent Bootstrap Admin Provisioning Script
 * Usage:
 *   INITIAL_ADMIN_EMAIL="admin@gmail.com" INITIAL_ADMIN_PASSWORD="admin123" npm run provision:admin
 *
 * Security Rules:
 * 1. Checks the database for any existing user with role = 'admin'.
 * 2. If an admin already exists, logs a message and exits immediately without modifying it.
 * 3. If no admin exists, creates exactly one initial admin account using
 *    process.env.INITIAL_ADMIN_EMAIL and process.env.INITIAL_ADMIN_PASSWORD.
 * 4. Hashes the password with bcrypt (cost factor 12), sets role = 'admin',
 *    and sets must_change_password = 1 (true) so the admin is forced to update
 *    their password immediately upon first login.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

dotenv.config();

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

async function openDatabaseConnection() {
  const dbHost = (process.env.DB_HOST || '').trim();
  if (dbHost) {
    try {
      const conn = await mysql.createConnection({
        host: dbHost,
        port: Number(process.env.DB_PORT || 3306),
        database: process.env.DB_DATABASE || 'threadcraft_v2',
        user: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        connectTimeout: 2500,
      });
      return {
        dialect: 'mysql',
        async get(sql, params = []) {
          const [rows] = await conn.execute(sql, params);
          return rows[0] || null;
        },
        async execute(sql, params = []) {
          const [res] = await conn.execute(sql, params);
          return { insertId: res.insertId, affectedRows: res.affectedRows };
        },
        async close() {
          await conn.end();
        },
      };
    } catch (mysqlErr) {
      console.warn(
        `[provision:admin] MySQL connection to ${dbHost} unavailable (${mysqlErr?.code || mysqlErr?.message}). Using local SQLite database.`
      );
    }
  }

  const sqlitePath = path.resolve(process.cwd(), 'database', 'threadcraft_v2.sqlite');
  const dir = path.dirname(sqlitePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(sqlitePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    status TEXT NOT NULL DEFAULT 'active',
    must_change_password INTEGER NOT NULL DEFAULT 0,
    notes TEXT NULL,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NULL UNIQUE,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL DEFAULT 'admin',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  return {
    dialect: 'sqlite',
    async get(sql, params = []) {
      const stmt = db.prepare(sql);
      return stmt.get(...params) || null;
    },
    async execute(sql, params = []) {
      const stmt = db.prepare(sql);
      const res = stmt.run(...params);
      return { insertId: Number(res.lastInsertRowid ?? 0), affectedRows: Number(res.changes ?? 0) };
    },
    async close() {
      db.close();
    },
  };
}

export async function provisionInitialAdmin(customDb = null) {
  const db = customDb || (await openDatabaseConnection());
  const shouldClose = !customDb;

  try {
    // 1. Check if ANY admin account already exists
    const existingAdmin = await db.get(
      'SELECT id, uuid, name, email, role FROM users WHERE role = ? LIMIT 1',
      ['admin']
    );

    if (existingAdmin) {
      console.log(
        `[provision:admin] Admin account already exists (email: ${existingAdmin.email}, id: ${existingAdmin.id}). Skipping provisioning without modifying existing admin.`
      );
      return { created: false, adminEmail: existingAdmin.email };
    }

    // 2. Read INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD from environment (with documented fallback for local setup)
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase();
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';

    if (!adminEmail || !adminEmail.includes('@')) {
      throw new Error('INITIAL_ADMIN_EMAIL must be a valid email address.');
    }
    if (!adminPassword || adminPassword.length < 6) {
      throw new Error('INITIAL_ADMIN_PASSWORD must be at least 6 characters.');
    }

    // 3. Hash password securely with bcrypt (never store plaintext)
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminUuid = `admin-${crypto.randomBytes(6).toString('hex')}`;
    const nowIso = new Date().toISOString();

    await db.execute(
      `INSERT INTO users (
        uuid, name, email, phone, password_hash, role, status, must_change_password, notes, loyalty_points, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminUuid,
        'System Administrator',
        adminEmail,
        '+8801700000000',
        passwordHash,
        'admin',
        'active',
        1, // must_change_password = true
        'Provisioned via idempotent bootstrap admin script. Mandatory password change required on first login.',
        0,
        nowIso,
      ]
    );

    await db.execute(
      `INSERT INTO admin_audit_logs (uuid, actor_name, actor_role, action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `audit-${Date.now()}`,
        'System Provisioner',
        'admin',
        'PROVISION_INITIAL_ADMIN',
        'USER',
        adminUuid,
        `Provisioned initial administrator (${adminEmail}) with must_change_password = true.`,
        nowIso,
      ]
    );

    console.log(
      `[provision:admin] Created initial admin account (${adminEmail}) with role='admin' and must_change_password=true.`
    );
    return { created: true, adminEmail };
  } finally {
    if (shouldClose) {
      await db.close();
    }
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  provisionInitialAdmin()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[provision:admin] Fatal error:', err.message || err);
      process.exit(1);
    });
}
