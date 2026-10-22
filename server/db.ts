import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import mysql from 'mysql2/promise';
import {
  initialCategories,
  initialProducts,
  initialDeliveryZones,
  initialDeliveryAreas,
  initialPaymentMethods,
  initialCoupons,
  initialSiteSettings,
  initialNewsPosts,
  initialStaticPages,
} from '../src/data/seedData.ts';
import { initialSmtpSettings, getInitialEmailTemplates } from '../src/services/emailService.ts';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

export interface DbRow {
  [key: string]: any;
}

export interface DbAdapter {
  dialect: 'mysql' | 'sqlite';
  query<T = DbRow>(sql: string, params?: any[]): Promise<T[]>;
  get<T = DbRow>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ insertId: number | string; affectedRows: number }>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

let activeAdapter: DbAdapter | null = null;

class SqliteAdapter implements DbAdapter {
  public dialect: 'mysql' | 'sqlite' = 'sqlite';
  private db: any;
  private inTx = false;

  constructor(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(filePath);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async query<T = DbRow>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const normalized = params.map(p => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));
    return stmt.all(...normalized) as T[];
  }

  async get<T = DbRow>(sql: string, params: any[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const normalized = params.map(p => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));
    const row = stmt.get(...normalized);
    return (row as T) ?? null;
  }

  async execute(sql: string, params: any[] = []): Promise<{ insertId: number | string; affectedRows: number }> {
    const stmt = this.db.prepare(sql);
    const normalized = params.map(p => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));
    const res = stmt.run(...normalized);
    return {
      insertId: Number(res.lastInsertRowid ?? 0),
      affectedRows: Number(res.changes ?? 0),
    };
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.inTx) {
      return fn();
    }
    this.inTx = true;
    this.db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
      const result = await fn();
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    } finally {
      this.inTx = false;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

class MysqlAdapter implements DbAdapter {
  public dialect: 'mysql' | 'sqlite' = 'mysql';
  private pool: mysql.Pool;

  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  async query<T = DbRow>(sql: string, params: any[] = []): Promise<T[]> {
    const normalized = params.map(p => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));
    const [rows] = await this.pool.execute(sql, normalized);
    return rows as T[];
  }

  async get<T = DbRow>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async execute(sql: string, params: any[] = []): Promise<{ insertId: number | string; affectedRows: number }> {
    const normalized = params.map(p => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));
    const [res]: any = await this.pool.execute(sql, normalized);
    return {
      insertId: res.insertId ?? 0,
      affectedRows: res.affectedRows ?? 0,
    };
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const conn = await this.pool.getConnection();
    await conn.beginTransaction();
    try {
      const result = await fn();
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export async function getDb(): Promise<DbAdapter> {
  if (activeAdapter) {
    return activeAdapter;
  }

  const dbHost = (process.env.DB_HOST || '').trim();
  if (dbHost) {
    try {
      const pool = mysql.createPool({
        host: dbHost,
        port: Number(process.env.DB_PORT || 3306),
        database: process.env.DB_DATABASE || 'threadcraft_v2',
        user: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 2500,
        namedPlaceholders: false,
      });
      await pool.query('SELECT 1');
      activeAdapter = new MysqlAdapter(pool);
    } catch (mysqlErr: any) {
      console.warn(
        `[ThreadCraft DB] MySQL connection to ${dbHost}:${process.env.DB_PORT || 3306} unavailable (${mysqlErr?.code || mysqlErr?.message}). Falling back to local SQLite database.`
      );
      const sqlitePath = path.resolve(process.cwd(), 'database', 'threadcraft_v2.sqlite');
      activeAdapter = new SqliteAdapter(sqlitePath);
    }
  } else {
    const sqlitePath = path.resolve(process.cwd(), 'database', 'threadcraft_v2.sqlite');
    activeAdapter = new SqliteAdapter(sqlitePath);
  }

  await initializeSchema(activeAdapter);
  return activeAdapter;
}

async function initializeSchema(db: DbAdapter): Promise<void> {
  if (db.dialect === 'sqlite') {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
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
      )`,
      `CREATE TABLE IF NOT EXISTS user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        csrf_token TEXT NOT NULL,
        ip_address TEXT NULL,
        user_agent TEXT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS user_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        label TEXT NOT NULL DEFAULT 'Home',
        recipient_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address_line TEXT NOT NULL,
        district TEXT NOT NULL,
        area_id TEXT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NULL,
        image_url TEXT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        short_description TEXT NULL,
        base_price REAL NOT NULL,
        is_featured INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'published',
        fabric_weight TEXT NOT NULL DEFAULT '240 GSM 100% Combed Cotton',
        fit_type TEXT NOT NULL DEFAULT 'Boxy Heavyweight',
        care_instructions TEXT NULL,
        seo_title TEXT NULL,
        seo_description TEXT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        product_id INTEGER NOT NULL,
        color_name TEXT NOT NULL,
        color_hex TEXT NOT NULL,
        size TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        price_override REAL NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS product_variant_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        product_id INTEGER NOT NULL,
        color_name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        alt_text TEXT NULL,
        is_primary INTEGER NOT NULL DEFAULT 0,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS delivery_zones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        name TEXT NOT NULL,
        fee REAL NOT NULL,
        estimated_delivery_time TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS delivery_areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        zone_id INTEGER NOT NULL,
        district_name TEXT NOT NULL,
        area_name TEXT NOT NULL,
        FOREIGN KEY (zone_id) REFERENCES delivery_zones (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        recipient_number TEXT NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'personal',
        instructions TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_order_amount REAL NOT NULL DEFAULT 0,
        max_discount_amount REAL NULL,
        usage_limit_global INTEGER NOT NULL DEFAULT 100,
        usage_limit_per_user INTEGER NOT NULL DEFAULT 1,
        used_count INTEGER NOT NULL DEFAULT 0,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NULL UNIQUE,
        order_number TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        shipping_address_line TEXT NOT NULL,
        shipping_district TEXT NOT NULL,
        shipping_area TEXT NOT NULL,
        delivery_zone_id TEXT NULL,
        delivery_zone_name TEXT NOT NULL,
        delivery_fee REAL NOT NULL,
        subtotal REAL NOT NULL,
        coupon_code TEXT NULL,
        coupon_discount REAL NOT NULL DEFAULT 0,
        loyalty_points_used INTEGER NOT NULL DEFAULT 0,
        loyalty_discount REAL NOT NULL DEFAULT 0,
        grand_total REAL NOT NULL,
        order_status TEXT NOT NULL DEFAULT 'pending',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        payment_method_id TEXT NULL,
        payment_method_name TEXT NOT NULL,
        payment_method_type TEXT NULL DEFAULT 'cod',
        payment_recipient_number TEXT NULL,
        payment_account_type TEXT NULL,
        carrier_name TEXT NULL,
        tracking_number TEXT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
      )`,
      `CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id TEXT NULL,
        variant_id TEXT NULL,
        product_name TEXT NOT NULL,
        sku TEXT NOT NULL,
        color_name TEXT NOT NULL,
        size TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        line_total REAL NOT NULL,
        image_url TEXT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NULL UNIQUE,
        order_id INTEGER NOT NULL,
        payment_method_id TEXT NULL,
        payment_method_name TEXT NOT NULL,
        sender_phone TEXT NULL,
        transaction_id TEXT NULL,
        amount_claimed REAL NOT NULL,
        customer_notes TEXT NULL,
        status TEXT NOT NULL DEFAULT 'awaiting_verification',
        verified_by TEXT NULL,
        verified_at TEXT NULL,
        rejection_reason TEXT NULL,
        admin_notes TEXT NULL,
        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS order_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NULL,
        order_id INTEGER NOT NULL,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        note TEXT NULL,
        actor TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        order_id TEXT NULL,
        points_delta INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        type TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NULL UNIQUE,
        actor_name TEXT NOT NULL,
        actor_role TEXT NOT NULL DEFAULT 'admin',
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS news_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        is_published INTEGER NOT NULL DEFAULT 1,
        published_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code_id TEXT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS product_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        product_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NULL,
        rating INTEGER NOT NULL,
        title TEXT NULL,
        comment TEXT NOT NULL,
        verified_purchase INTEGER NOT NULL DEFAULT 0,
        helpful_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS payment_webhook_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        gateway TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        sender_phone TEXT NOT NULL,
        amount REAL NOT NULL,
        order_reference TEXT NULL,
        matched_order_id TEXT NULL,
        matched_order_number TEXT NULL,
        status TEXT NOT NULL,
        signature_verified INTEGER NOT NULL DEFAULT 1,
        processed_note TEXT NOT NULL,
        raw_payload TEXT NOT NULL,
        received_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        to_email TEXT NOT NULL,
        to_name TEXT NOT NULL,
        from_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        type TEXT NOT NULL,
        related_order_id TEXT NULL,
        status TEXT NOT NULL DEFAULT 'sent',
        smtp_host_used TEXT NOT NULL,
        sent_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const stmt of statements) {
      await db.execute(stmt);
    }
  } else {
    // MySQL migration execution
    const schemaPath = path.resolve(process.cwd(), 'database', 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      const statements = sqlContent
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      for (const stmt of statements) {
        await db.execute(stmt);
      }
    }
  }

  // Ensure initial storefront catalog & configuration exist ONLY if products table is completely empty.
  // Phase 2 rule: Never automatically seed demo accounts, fake orders, or fake customer activity on boot.
  await initializeStorefrontCatalogIfEmpty(db);
}

async function initializeStorefrontCatalogIfEmpty(db: DbAdapter): Promise<void> {
  const prodCountRow = await db.get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM products');
  const prodCount = Number(prodCountRow?.cnt ?? 0);

  if (prodCount > 0) {
    return;
  }

  await db.transaction(async () => {
    // 1. Categories
    const categoryIdMap = new Map<string, number>();
    for (const cat of initialCategories) {
      const res = await db.execute(
        `INSERT INTO categories (code_id, name, slug, description, image_url, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.slug, cat.description, cat.imageUrl || null, cat.displayOrder, cat.isActive ? 1 : 0]
      );
      categoryIdMap.set(cat.id, Number(res.insertId));
    }

    // 2. Products, Variants & Variant Images
    for (const prod of initialProducts) {
      const catDbId = categoryIdMap.get(prod.categoryId) || 1;
      const prodRes = await db.execute(
        `INSERT INTO products (
          code_id, category_id, name, slug, description, short_description,
          base_price, is_featured, status, fabric_weight, fit_type,
          care_instructions, seo_title, seo_description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prod.id,
          catDbId,
          prod.name,
          prod.slug,
          prod.description,
          prod.shortDescription,
          prod.basePrice,
          prod.isFeatured ? 1 : 0,
          prod.status,
          prod.fabricWeight,
          prod.fitType,
          prod.careInstructions,
          prod.seoTitle || null,
          prod.seoDescription || null,
          prod.createdAt,
        ]
      );
      const prodDbId = Number(prodRes.insertId);

      for (const v of prod.variants) {
        await db.execute(
          `INSERT INTO product_variants (
            code_id, product_id, color_name, color_hex, size, sku, price_override, stock_quantity, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            v.id,
            prodDbId,
            v.colorName,
            v.colorHex,
            v.size,
            v.sku,
            v.priceOverride,
            v.stockQuantity,
            v.isActive ? 1 : 0,
          ]
        );
      }

      for (const img of prod.images) {
        await db.execute(
          `INSERT INTO product_variant_images (
            code_id, product_id, color_name, image_url, alt_text, is_primary, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            img.id,
            prodDbId,
            img.colorName,
            img.imageUrl,
            img.altText || null,
            img.isPrimary ? 1 : 0,
            img.displayOrder,
          ]
        );
      }
    }

    // 3. Delivery Zones & Areas
    const zoneIdMap = new Map<string, number>();
    for (const z of initialDeliveryZones) {
      const zRes = await db.execute(
        `INSERT INTO delivery_zones (code_id, name, fee, estimated_delivery_time, is_active, display_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [z.id, z.name, z.fee, z.estimatedDeliveryTime, z.isActive ? 1 : 0, z.displayOrder]
      );
      zoneIdMap.set(z.id, Number(zRes.insertId));
    }

    for (const a of initialDeliveryAreas) {
      const zDbId = zoneIdMap.get(a.zoneId) || 1;
      await db.execute(
        `INSERT INTO delivery_areas (code_id, zone_id, district_name, area_name)
         VALUES (?, ?, ?, ?)`,
        [a.id, zDbId, a.districtName, a.areaName]
      );
    }

    // 4. Payment Methods
    for (const pm of initialPaymentMethods) {
      await db.execute(
        `INSERT INTO payment_methods (code, name, type, recipient_number, account_type, instructions, is_enabled, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pm.id,
          pm.name,
          pm.type,
          pm.recipientNumber,
          pm.accountType,
          pm.instructions,
          pm.isEnabled ? 1 : 0,
          pm.displayOrder,
        ]
      );
    }

    // 5. Coupons
    for (const cp of initialCoupons) {
      await db.execute(
        `INSERT INTO coupons (
          code_id, code, discount_type, discount_value, min_order_amount, max_discount_amount,
          usage_limit_global, usage_limit_per_user, used_count, start_date, end_date, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cp.id,
          cp.code,
          cp.discountType,
          cp.discountValue,
          cp.minOrderAmount,
          cp.maxDiscountAmount ?? null,
          cp.usageLimitGlobal,
          cp.usageLimitPerUser,
          0,
          cp.startDate,
          cp.endDate,
          cp.isActive ? 1 : 0,
        ]
      );
    }

    // 6. Site Settings, SMTP, Email Templates, Webhook Config
    const defaultWebhookConfig = {
      endpointUrl: 'https://api.threadcraft.store/v2/webhooks/payment-ipn',
      secretKey: 'whsec_tc_live_98a4f2c1e8b309d74b1a',
      isEnabled: true,
      autoVerifyMatchedOrders: true,
      autoCreateOrderFromDraftOnWebhook: true,
    };

    const settingsEntries: [string, any][] = [
      ['site_settings', initialSiteSettings],
      ['smtp_settings', initialSmtpSettings],
      ['email_templates', getInitialEmailTemplates()],
      ['webhook_config', defaultWebhookConfig],
    ];

    for (const [k, v] of settingsEntries) {
      await db.execute(`INSERT INTO site_settings (key, value) VALUES (?, ?)`, [k, JSON.stringify(v)]);
    }

    // 7. News Posts
    for (const post of initialNewsPosts) {
      await db.execute(
        `INSERT INTO news_posts (code_id, title, slug, excerpt, content, image_url, author, category, is_published, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          post.id,
          post.title,
          post.slug,
          post.excerpt,
          post.content,
          post.imageUrl || null,
          post.author,
          post.category,
          post.isPublished ? 1 : 0,
          post.publishedAt,
        ]
      );
    }

    // 8. Static Pages
    for (const page of initialStaticPages) {
      await db.execute(
        `INSERT INTO pages (code_id, slug, title, content, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [page.id, page.slug, page.title, page.content, page.updatedAt]
      );
    }
  });
}
