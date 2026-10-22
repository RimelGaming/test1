import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getDb } from './server/db.ts';
import type { DbAdapter } from './server/db.ts';
import {
  initialSiteSettings,
} from './src/data/seedData.ts';
import { initialSmtpSettings, getInitialEmailTemplates } from './src/services/emailService.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_fallback_session_secret_threadcraft_v2';
const CSRF_SECRET = process.env.CSRF_SECRET || 'dev_fallback_csrf_secret_threadcraft_v2';
const SESSION_COOKIE_NAME = 'tc_session';
const GUEST_CSRF_COOKIE_NAME = 'tc_csrf';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function generateCsrfToken(contextSeed = ''): string {
  const randomNonce = crypto.randomBytes(24).toString('hex');
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${randomNonce}:${contextSeed}`)
    .digest('hex')
    .slice(0, 16);
  return `${randomNonce}${signature}`;
}

interface AuthenticatedRequest extends Request {
  user?: {
    dbId: number;
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'customer' | 'admin';
    status: 'active' | 'suspended' | 'archived';
    mustChangePassword: boolean;
    notes?: string;
    loyaltyPoints: number;
    addresses: any[];
    createdAt: string;
  };
  csrfToken?: string;
  sessionId?: string;
}

function sanitizeText(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 191;
}

function safeTimingEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function getCookieOptions(req: Request, httpOnly = true) {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS,
  };
}

async function formatUserFromRow(db: DbAdapter, row: any) {
  const addrRows = await db.query(
    `SELECT id, uuid, label, recipient_name, phone, address_line, district, area_id, is_default
     FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC`,
    [row.id]
  );

  return {
    dbId: Number(row.id),
    id: String(row.uuid || `user-${row.id}`),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    role: (row.role === 'admin' ? 'admin' : 'customer') as 'customer' | 'admin',
    status: (row.status || 'active') as 'active' | 'suspended' | 'archived',
    mustChangePassword: Boolean(Number(row.must_change_password ?? 0)),
    notes: row.notes || undefined,
    loyaltyPoints: Number(row.loyalty_points ?? 0),
    createdAt: String(row.created_at || new Date().toISOString()),
    addresses: addrRows.map((a: any) => ({
      id: String(a.uuid || `addr-${a.id}`),
      userId: String(row.uuid || `user-${row.id}`),
      label: String(a.label || 'Home'),
      recipientName: String(a.recipient_name),
      phone: String(a.phone),
      addressLine: String(a.address_line),
      district: String(a.district),
      areaId: String(a.area_id || 'area-1'),
      isDefault: Boolean(Number(a.is_default ?? 0)),
    })),
  };
}

async function loadAllUsers(db: DbAdapter) {
  const rows = await db.query(
    `SELECT id, uuid, name, email, phone, role, status, must_change_password, notes, loyalty_points, created_at
     FROM users ORDER BY id ASC`
  );
  const result = [];
  for (const r of rows) {
    const u = await formatUserFromRow(db, r);
    const { dbId, ...publicUser } = u;
    result.push(publicUser);
  }
  return result;
}

async function loadAllProducts(db: DbAdapter) {
  const catRows = await db.query('SELECT id, code_id FROM categories');
  const catCodeByDbId = new Map<number, string>();
  for (const c of catRows) {
    catCodeByDbId.set(Number(c.id), String(c.code_id || `cat-${c.id}`));
  }

  const prodRows = await db.query('SELECT * FROM products ORDER BY id ASC');
  const variantRows = await db.query('SELECT * FROM product_variants ORDER BY id ASC');
  const imageRows = await db.query('SELECT * FROM product_variant_images ORDER BY display_order ASC, id ASC');

  return prodRows.map((p: any) => {
    const prodCodeId = String(p.code_id || `prod-${p.id}`);
    const pVariants = variantRows
      .filter((v: any) => Number(v.product_id) === Number(p.id))
      .map((v: any) => ({
        id: String(v.code_id || `v-${v.id}`),
        productId: prodCodeId,
        colorName: String(v.color_name),
        colorHex: String(v.color_hex),
        size: String(v.size),
        sku: String(v.sku),
        priceOverride: v.price_override !== null && v.price_override !== undefined ? Number(v.price_override) : null,
        stockQuantity: Number(v.stock_quantity ?? 0),
        isActive: Boolean(Number(v.is_active ?? 1)),
      }));

    const pImages = imageRows
      .filter((img: any) => Number(img.product_id) === Number(p.id))
      .map((img: any) => ({
        id: String(img.code_id || `img-${img.id}`),
        colorName: String(img.color_name),
        imageUrl: String(img.image_url),
        altText: String(img.alt_text || p.name),
        isPrimary: Boolean(Number(img.is_primary ?? 0)),
        displayOrder: Number(img.display_order ?? 1),
      }));

    return {
      id: prodCodeId,
      name: String(p.name),
      slug: String(p.slug),
      description: String(p.description),
      shortDescription: String(p.short_description || ''),
      categoryId: catCodeByDbId.get(Number(p.category_id)) || 'cat-1',
      basePrice: Number(p.base_price),
      isFeatured: Boolean(Number(p.is_featured ?? 0)),
      status: String(p.status || 'published'),
      fabricWeight: String(p.fabric_weight || '240 GSM 100% Combed Cotton'),
      fitType: String(p.fit_type || 'Boxy Heavyweight'),
      careInstructions: String(p.care_instructions || ''),
      seoTitle: p.seo_title || undefined,
      seoDescription: p.seo_description || undefined,
      variants: pVariants,
      images: pImages,
      createdAt: String(p.created_at || new Date().toISOString()),
    };
  });
}

async function loadAllOrders(db: DbAdapter) {
  const orderRows = await db.query('SELECT * FROM orders ORDER BY id DESC');
  const itemRows = await db.query('SELECT * FROM order_items ORDER BY id ASC');
  const paymentRows = await db.query('SELECT * FROM payments ORDER BY id DESC');
  const historyRows = await db.query('SELECT * FROM order_status_history ORDER BY id ASC');
  const userRows = await db.query('SELECT id, uuid FROM users');
  const userUuidByDbId = new Map<number, string>();
  for (const u of userRows) {
    userUuidByDbId.set(Number(u.id), String(u.uuid || `user-${u.id}`));
  }

  return orderRows.map((o: any) => {
    const orderCodeId = String(o.uuid || `ord-${o.id}`);
    const items = itemRows
      .filter((it: any) => Number(it.order_id) === Number(o.id))
      .map((it: any) => ({
        productId: String(it.product_id || ''),
        variantId: String(it.variant_id || ''),
        productName: String(it.product_name),
        sku: String(it.sku),
        colorName: String(it.color_name),
        size: String(it.size),
        unitPrice: Number(it.unit_price),
        quantity: Number(it.quantity),
        lineTotal: Number(it.line_total),
        imageUrl: String(it.image_url || ''),
      }));

    const claimRow = paymentRows.find((p: any) => Number(p.order_id) === Number(o.id));
    const paymentClaim = claimRow
      ? {
          id: String(claimRow.uuid || `claim-${claimRow.id}`),
          orderId: orderCodeId,
          paymentMethodId: String(claimRow.payment_method_id || o.payment_method_id || ''),
          paymentMethodName: String(claimRow.payment_method_name),
          senderPhone: String(claimRow.sender_phone || ''),
          transactionId: String(claimRow.transaction_id || ''),
          amountClaimed: Number(claimRow.amount_claimed),
          customerNotes: claimRow.customer_notes || undefined,
          submittedAt: String(claimRow.submitted_at || o.created_at),
          verifiedAt: claimRow.verified_at || undefined,
          verifiedBy: claimRow.verified_by || undefined,
          rejectionReason: claimRow.rejection_reason || undefined,
          adminNotes: claimRow.admin_notes || undefined,
        }
      : null;

    const statusHistory = historyRows
      .filter((h: any) => Number(h.order_id) === Number(o.id))
      .map((h: any) => ({
        id: String(h.uuid || `sh-${h.id}`),
        orderId: orderCodeId,
        fromStatus: String(h.from_status),
        toStatus: String(h.to_status),
        note: String(h.note || ''),
        actor: String(h.actor || 'System'),
        timestamp: String(h.created_at || o.created_at),
      }));

    return {
      id: orderCodeId,
      orderNumber: String(o.order_number),
      userId: userUuidByDbId.get(Number(o.user_id)) || String(o.user_id),
      customerName: String(o.customer_name),
      customerEmail: String(o.customer_email),
      customerPhone: String(o.customer_phone),
      deliveryAddressSnapshot: {
        recipientName: String(o.customer_name),
        phone: String(o.customer_phone),
        addressLine: String(o.shipping_address_line),
        district: String(o.shipping_district),
        areaName: String(o.shipping_area),
      },
      deliveryZoneSnapshot: {
        id: String(o.delivery_zone_id || 'zone-1'),
        name: String(o.delivery_zone_name),
        fee: Number(o.delivery_fee),
      },
      items,
      subtotal: Number(o.subtotal),
      couponCodeApplied: o.coupon_code || undefined,
      couponDiscount: Number(o.coupon_discount ?? 0),
      loyaltyPointsUsed: Number(o.loyalty_points_used ?? 0),
      loyaltyDiscount: Number(o.loyalty_discount ?? 0),
      deliveryFee: Number(o.delivery_fee),
      grandTotal: Number(o.grand_total),
      orderStatus: String(o.order_status || 'pending'),
      paymentStatus: String(o.payment_status || 'unpaid'),
      paymentMethodId: String(o.payment_method_id || 'pm-cod'),
      paymentMethodSnapshot: {
        name: String(o.payment_method_name),
        type: String(o.payment_method_type || 'cod'),
        recipientNumber: String(o.payment_recipient_number || 'N/A'),
        accountType: String(o.payment_account_type || 'personal'),
      },
      paymentClaim,
      carrierName: o.carrier_name || undefined,
      trackingNumber: o.tracking_number || undefined,
      statusHistory,
      createdAt: String(o.created_at || new Date().toISOString()),
    };
  });
}

async function startServer() {
  const db = await getDb();
  const app = express();

  app.set('trust proxy', 1);
  app.use(cookieParser(SESSION_SECRET));
  app.use(express.json({ limit: '10mb' }));

  // Rate limiters for authentication endpoints
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per IP per 15m window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many authentication attempts from this IP. Please wait 15 minutes and try again.',
    },
  });

  // Session & CSRF hydration middleware
  app.use(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
      if (sessionId && typeof sessionId === 'string') {
        const sessionRow = await db.get(
          `SELECT session_id, user_id, csrf_token, expires_at
           FROM user_sessions WHERE session_id = ? LIMIT 1`,
          [sessionId]
        );

        if (sessionRow) {
          const expiresAt = new Date(String(sessionRow.expires_at)).getTime();
          if (expiresAt > Date.now()) {
            const userRow = await db.get(
              `SELECT id, uuid, name, email, phone, role, status, must_change_password, notes, loyalty_points, created_at
               FROM users WHERE id = ? LIMIT 1`,
              [sessionRow.user_id]
            );
            if (userRow && userRow.status === 'active') {
              req.user = await formatUserFromRow(db, userRow);
              req.csrfToken = String(sessionRow.csrf_token);
              req.sessionId = String(sessionRow.session_id);
            }
          } else {
            await db.execute('DELETE FROM user_sessions WHERE session_id = ?', [sessionId]);
          }
        }
      }

      // Ensure guest CSRF token cookie is available when unauthenticated
      if (!req.csrfToken) {
        let guestCsrf = req.cookies?.[GUEST_CSRF_COOKIE_NAME];
        if (!guestCsrf || typeof guestCsrf !== 'string' || guestCsrf.length < 32) {
          guestCsrf = generateCsrfToken('guest');
          res.cookie(GUEST_CSRF_COOKIE_NAME, guestCsrf, getCookieOptions(req, false));
        }
        req.csrfToken = guestCsrf;
      }

      next();
    } catch (err) {
      next(err);
    }
  });

  // Middleware: Require valid CSRF token on state-changing requests
  const requireCsrf = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    const headerToken = String(req.headers['x-csrf-token'] || '');
    const expectedToken = String(req.csrfToken || '');
    if (!safeTimingEqual(headerToken, expectedToken)) {
      return res.status(403).json({
        error: 'Invalid or missing CSRF security token. Please refresh the page and try again.',
      });
    }
    next();
  };

  // Middleware: Require authenticated active user session
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    next();
  };

  // Middleware: Require verified admin role AND must_change_password === false
  const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Administrator access required.' });
    }
    if (req.user.mustChangePassword) {
      return res.status(403).json({
        error: 'PASSWORD_CHANGE_REQUIRED',
        mustChangePassword: true,
        message: 'Mandatory security policy: You must change your temporary password before accessing admin operations.',
      });
    }
    next();
  };

  // ============================================================================
  // 1. AUTHENTICATION & SESSION ENDPOINTS
  // ============================================================================

  app.get('/api/auth/me', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.json({
        authenticated: false,
        user: null,
        csrfToken: req.csrfToken,
      });
    }
    const { dbId, ...publicUser } = req.user;
    return res.json({
      authenticated: true,
      user: publicUser,
      csrfToken: req.csrfToken,
    });
  });

  // Public Customer Registration — ALWAYS enforces role = 'customer', ignores req.body.role
  app.post('/api/auth/register', authRateLimiter, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const name = sanitizeText(req.body?.name, 120);
      const email = sanitizeText(req.body?.email, 191).toLowerCase();
      const phone = sanitizeText(req.body?.phone, 30);
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'Name, email, phone number, and password are required.' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1', [email]);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userUuid = `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const nowIso = new Date().toISOString();

      // Strictly hardcode 'customer' role and must_change_password = 0 in SQL parameters
      const insertRes = await db.execute(
        `INSERT INTO users (uuid, name, email, phone, password_hash, role, status, must_change_password, loyalty_points, created_at)
         VALUES (?, ?, ?, ?, ?, 'customer', 'active', 0, 100, ?)`,
        [userUuid, name, email, phone, passwordHash, nowIso]
      );

      const newUserDbId = Number(insertRes.insertId);

      // Welcome bonus loyalty transaction
      await db.execute(
        `INSERT INTO loyalty_transactions (uuid, user_id, points_delta, balance_after, type, reason, created_at)
         VALUES (?, ?, 100, 100, 'bonus', 'Welcome bonus on registration', ?)`,
        [`ltx-${Date.now()}`, newUserDbId, nowIso]
      );

      // Create server-side session
      const sessionId = crypto.randomBytes(48).toString('hex');
      const csrfToken = generateCsrfToken(sessionId);
      const expiresIso = new Date(Date.now() + SESSION_TTL_MS).toISOString();

      await db.execute(
        `INSERT INTO user_sessions (session_id, user_id, csrf_token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          newUserDbId,
          csrfToken,
          sanitizeText(req.ip, 64),
          sanitizeText(req.headers['user-agent'], 255),
          expiresIso,
        ]
      );

      res.cookie(SESSION_COOKIE_NAME, sessionId, getCookieOptions(req, true));

      const userRow = await db.get('SELECT * FROM users WHERE id = ? LIMIT 1', [newUserDbId]);
      const formattedUser = await formatUserFromRow(db, userRow);
      const { dbId, ...publicUser } = formattedUser;

      return res.status(201).json({
        success: true,
        user: publicUser,
        csrfToken,
      });
    } catch (err: any) {
      console.error('[POST /api/auth/register] Error:', err);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  // Login endpoint with bcrypt verification & rate limiting
  app.post('/api/auth/login', authRateLimiter, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const email = sanitizeText(req.body?.email, 191).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!email || !password) {
        return res.status(400).json({ error: 'Email address and password are required.' });
      }

      const userRow = await db.get(
        `SELECT id, uuid, name, email, phone, password_hash, role, status, must_change_password, notes, loyalty_points, created_at
         FROM users WHERE LOWER(email) = ? LIMIT 1`,
        [email]
      );

      if (!userRow) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const validPassword = await bcrypt.compare(password, String(userRow.password_hash));
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (userRow.status !== 'active') {
        return res.status(403).json({
          error: `Your account is currently ${userRow.status}. Please contact customer support.`,
        });
      }

      const sessionId = crypto.randomBytes(48).toString('hex');
      const csrfToken = generateCsrfToken(sessionId);
      const expiresIso = new Date(Date.now() + SESSION_TTL_MS).toISOString();

      await db.execute(
        `INSERT INTO user_sessions (session_id, user_id, csrf_token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          userRow.id,
          csrfToken,
          sanitizeText(req.ip, 64),
          sanitizeText(req.headers['user-agent'], 255),
          expiresIso,
        ]
      );

      res.cookie(SESSION_COOKIE_NAME, sessionId, getCookieOptions(req, true));

      const formattedUser = await formatUserFromRow(db, userRow);
      const { dbId, ...publicUser } = formattedUser;

      return res.json({
        success: true,
        user: publicUser,
        csrfToken,
      });
    } catch (err: any) {
      console.error('[POST /api/auth/login] Error:', err);
      return res.status(500).json({ error: 'Sign in failed. Please try again.' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
      if (sessionId) {
        await db.execute('DELETE FROM user_sessions WHERE session_id = ?', [sessionId]);
      }
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      const newGuestCsrf = generateCsrfToken('guest');
      res.cookie(GUEST_CSRF_COOKIE_NAME, newGuestCsrf, getCookieOptions(req, false));
      return res.json({ success: true, csrfToken: newGuestCsrf });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to sign out.' });
    }
  });

  // Mandatory & Voluntary Password Change Endpoint
  app.post(
    '/api/auth/change-password',
    authRateLimiter,
    requireAuth,
    requireCsrf,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
        const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

        if (!currentPassword || !newPassword) {
          return res.status(400).json({ error: 'Current password and new password are required.' });
        }
        if (newPassword.length < 8) {
          return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
        }

        const userRow = await db.get('SELECT id, password_hash FROM users WHERE id = ? LIMIT 1', [
          req.user!.dbId,
        ]);
        if (!userRow) {
          return res.status(404).json({ error: 'User account not found.' });
        }

        const matchesCurrent = await bcrypt.compare(currentPassword, String(userRow.password_hash));
        if (!matchesCurrent) {
          return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        const matchesSame = await bcrypt.compare(newPassword, String(userRow.password_hash));
        if (matchesSame) {
          return res.status(400).json({
            error: 'New password must be different from your current temporary password.',
          });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await db.execute(
          'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
          [newHash, req.user!.dbId]
        );

        await db.execute(
          `INSERT INTO admin_audit_logs (uuid, actor_name, actor_role, action, entity_type, entity_id, details, created_at)
           VALUES (?, ?, ?, 'CHANGE_PASSWORD', 'USER', ?, ?, ?)`,
          [
            `audit-${Date.now()}`,
            req.user!.name,
            req.user!.role,
            req.user!.id,
            `User (${req.user!.email}) updated their password and cleared must_change_password flag.`,
            new Date().toISOString(),
          ]
        );

        const updatedRow = await db.get('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user!.dbId]);
        const formattedUser = await formatUserFromRow(db, updatedRow);
        const { dbId, ...publicUser } = formattedUser;

        return res.json({
          success: true,
          message: 'Password updated successfully.',
          user: publicUser,
        });
      } catch (err) {
        console.error('[POST /api/auth/change-password] Error:', err);
        return res.status(500).json({ error: 'Failed to update password.' });
      }
    }
  );

  // ============================================================================
  // 2. STOREFRONT & BOOTSTRAP DATA ENDPOINT
  // ============================================================================

  app.get('/api/bootstrap', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const catRows = await db.query('SELECT * FROM categories ORDER BY display_order ASC, id ASC');
      const categories = catRows.map((c: any) => ({
        id: String(c.code_id || `cat-${c.id}`),
        name: String(c.name),
        slug: String(c.slug),
        description: String(c.description || ''),
        imageUrl: c.image_url || undefined,
        displayOrder: Number(c.display_order ?? 1),
        isActive: Boolean(Number(c.is_active ?? 1)),
      }));

      const products = await loadAllProducts(db);

      const zoneRows = await db.query('SELECT * FROM delivery_zones ORDER BY display_order ASC, id ASC');
      const zoneCodeByDbId = new Map<number, string>();
      const deliveryZones = zoneRows.map((z: any) => {
        const zCode = String(z.code_id || `zone-${z.id}`);
        zoneCodeByDbId.set(Number(z.id), zCode);
        return {
          id: zCode,
          name: String(z.name),
          fee: Number(z.fee),
          estimatedDeliveryTime: String(z.estimated_delivery_time),
          isActive: Boolean(Number(z.is_active ?? 1)),
          displayOrder: Number(z.display_order ?? 1),
        };
      });

      const areaRows = await db.query('SELECT * FROM delivery_areas ORDER BY id ASC');
      const deliveryAreas = areaRows.map((a: any) => ({
        id: String(a.code_id || `area-${a.id}`),
        zoneId: zoneCodeByDbId.get(Number(a.zone_id)) || 'zone-1',
        districtName: String(a.district_name),
        areaName: String(a.area_name),
      }));

      const pmRows = await db.query('SELECT * FROM payment_methods ORDER BY display_order ASC, id ASC');
      const paymentMethods = pmRows.map((pm: any) => ({
        id: String(pm.code || `pm-${pm.id}`),
        name: String(pm.name),
        type: String(pm.type),
        recipientNumber: String(pm.recipient_number),
        accountType: String(pm.account_type || 'personal'),
        instructions: String(pm.instructions),
        isEnabled: Boolean(Number(pm.is_enabled ?? 1)),
        displayOrder: Number(pm.display_order ?? 1),
      }));

      const cpRows = await db.query('SELECT * FROM coupons ORDER BY id ASC');
      const coupons = cpRows.map((cp: any) => ({
        id: String(cp.code_id || `cp-${cp.id}`),
        code: String(cp.code),
        discountType: String(cp.discount_type),
        discountValue: Number(cp.discount_value),
        minOrderAmount: Number(cp.min_order_amount ?? 0),
        maxDiscountAmount: cp.max_discount_amount !== null ? Number(cp.max_discount_amount) : undefined,
        usageLimitGlobal: Number(cp.usage_limit_global ?? 100),
        usageLimitPerUser: Number(cp.usage_limit_per_user ?? 1),
        usedCount: Number(cp.used_count ?? 0),
        startDate: String(cp.start_date),
        endDate: String(cp.end_date),
        isActive: Boolean(Number(cp.is_active ?? 1)),
      }));

      const settingsRows = await db.query('SELECT key, value FROM site_settings');
      const settingsMap = new Map<string, any>();
      for (const s of settingsRows) {
        try {
          settingsMap.set(String(s.key), JSON.parse(String(s.value)));
        } catch {
          // ignore malformed JSON
        }
      }

      const siteSettings = settingsMap.get('site_settings') || initialSiteSettings;
      const newsRows = await db.query('SELECT * FROM news_posts ORDER BY published_at DESC, id DESC');
      const newsPosts = newsRows.map((n: any) => ({
        id: String(n.code_id || `post-${n.id}`),
        title: String(n.title),
        slug: String(n.slug),
        excerpt: String(n.excerpt),
        content: String(n.content),
        imageUrl: String(n.image_url || ''),
        author: String(n.author),
        publishedAt: String(n.published_at),
        isPublished: Boolean(Number(n.is_published ?? 1)),
        category: String(n.category),
      }));

      const pageRows = await db.query('SELECT * FROM pages ORDER BY id ASC');
      const staticPages = pageRows.map((p: any) => ({
        id: String(p.code_id || `page-${p.id}`),
        slug: String(p.slug),
        title: String(p.title),
        content: String(p.content),
        updatedAt: String(p.updated_at || '2026-10-01'),
      }));

      const reviewRows = await db.query('SELECT * FROM product_reviews ORDER BY created_at DESC, id DESC');
      const reviews = reviewRows.map((r: any) => ({
        id: String(r.uuid),
        productId: String(r.product_id),
        userId: String(r.user_id),
        userName: String(r.user_name),
        userEmail: r.user_email || undefined,
        rating: Number(r.rating),
        title: r.title || undefined,
        comment: String(r.comment),
        createdAt: String(r.created_at),
        verifiedPurchase: Boolean(Number(r.verified_purchase ?? 0)),
        helpfulCount: Number(r.helpful_count ?? 0),
      }));

      // Include orders & loyalty transactions scoped appropriately
      const allOrders = await loadAllOrders(db);
      const isVerifiedAdmin = req.user?.role === 'admin' && !req.user.mustChangePassword;

      const visibleOrders = isVerifiedAdmin
        ? allOrders
        : req.user
        ? allOrders.filter(o => o.userId === req.user!.id || o.customerEmail.toLowerCase() === req.user!.email.toLowerCase())
        : [];

      const ltxRows = await db.query(
        `SELECT lt.*, u.uuid as user_uuid
         FROM loyalty_transactions lt
         JOIN users u ON u.id = lt.user_id
         ORDER BY lt.id DESC`
      );
      const allLoyaltyTxs = ltxRows.map((lt: any) => ({
        id: String(lt.uuid || `ltx-${lt.id}`),
        userId: String(lt.user_uuid || `user-${lt.user_id}`),
        orderId: lt.order_id || undefined,
        pointsDelta: Number(lt.points_delta),
        balanceAfter: Number(lt.balance_after),
        type: String(lt.type),
        reason: String(lt.reason),
        timestamp: String(lt.created_at),
      }));

      const visibleLoyaltyTxs = isVerifiedAdmin
        ? allLoyaltyTxs
        : req.user
        ? allLoyaltyTxs.filter(tx => tx.userId === req.user!.id)
        : [];

      let adminData: any = null;
      if (isVerifiedAdmin) {
        const users = await loadAllUsers(db);
        const auditRows = await db.query('SELECT * FROM admin_audit_logs ORDER BY id DESC LIMIT 300');
        const auditLogs = auditRows.map((a: any) => ({
          id: String(a.uuid || `audit-${a.id}`),
          actorName: String(a.actor_name),
          actorRole: String(a.actor_role),
          action: String(a.action),
          entityType: String(a.entity_type),
          entityId: String(a.entity_id),
          details: String(a.details),
          timestamp: String(a.created_at),
        }));

        const webhookRows = await db.query('SELECT * FROM payment_webhook_logs ORDER BY id DESC LIMIT 200');
        const webhookLogs = webhookRows.map((w: any) => ({
          id: String(w.uuid),
          gateway: String(w.gateway),
          transactionId: String(w.transaction_id),
          senderPhone: String(w.sender_phone),
          amount: Number(w.amount),
          orderReference: w.order_reference || undefined,
          matchedOrderId: w.matched_order_id || undefined,
          matchedOrderNumber: w.matched_order_number || undefined,
          status: String(w.status),
          signatureVerified: Boolean(Number(w.signature_verified ?? 1)),
          receivedAt: String(w.received_at),
          processedNote: String(w.processed_note),
          rawPayload: String(w.raw_payload),
        }));

        const emailRows = await db.query('SELECT * FROM email_logs ORDER BY id DESC LIMIT 200');
        const emailLogs = emailRows.map((e: any) => ({
          id: String(e.uuid),
          to: String(e.to_email),
          toName: String(e.to_name),
          from: String(e.from_email),
          subject: String(e.subject),
          htmlContent: String(e.html_content),
          type: String(e.type),
          relatedOrderId: e.related_order_id || undefined,
          status: String(e.status),
          smtpHostUsed: String(e.smtp_host_used),
          sentAt: String(e.sent_at),
        }));

        adminData = {
          users,
          auditLogs,
          webhookLogs,
          emailLogs,
          smtpSettings: settingsMap.get('smtp_settings') || initialSmtpSettings,
          emailTemplates: settingsMap.get('email_templates') || getInitialEmailTemplates(),
          webhookConfig: settingsMap.get('webhook_config') || {
            endpointUrl: 'https://api.threadcraft.store/v2/webhooks/payment-ipn',
            secretKey: 'whsec_tc_live_98a4f2c1e8b309d74b1a',
            isEnabled: true,
            autoVerifyMatchedOrders: true,
            autoCreateOrderFromDraftOnWebhook: true,
          },
        };
      }

      const publicUser = req.user ? (() => { const { dbId, ...u } = req.user!; return u; })() : null;

      return res.json({
        user: publicUser,
        csrfToken: req.csrfToken,
        categories,
        products,
        deliveryZones,
        deliveryAreas,
        paymentMethods,
        coupons,
        siteSettings,
        newsPosts,
        staticPages,
        reviews,
        orders: visibleOrders,
        loyaltyTransactions: visibleLoyaltyTxs,
        adminData,
      });
    } catch (err) {
      console.error('[GET /api/bootstrap] Error:', err);
      return res.status(500).json({ error: 'Failed to load store data.' });
    }
  });

  // ============================================================================
  // 3. CUSTOMER ACCOUNT & ORDER ENDPOINTS
  // ============================================================================

  app.put('/api/account/profile', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    const name = sanitizeText(req.body?.name, 120);
    const phone = sanitizeText(req.body?.phone, 30);
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }
    await db.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user!.dbId]);
    const updatedRow = await db.get('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user!.dbId]);
    const formatted = await formatUserFromRow(db, updatedRow);
    const { dbId, ...publicUser } = formatted;
    return res.json({ success: true, user: publicUser });
  });

  app.post('/api/account/addresses', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    const label = sanitizeText(req.body?.label || 'Home', 60);
    const recipientName = sanitizeText(req.body?.recipientName, 120);
    const phone = sanitizeText(req.body?.phone, 30);
    const addressLine = sanitizeText(req.body?.addressLine, 500);
    const district = sanitizeText(req.body?.district, 60);
    const areaId = sanitizeText(req.body?.areaId, 60);
    const isDefault = Boolean(req.body?.isDefault);

    if (!recipientName || !phone || !addressLine || !district) {
      return res.status(400).json({ error: 'All address fields are required.' });
    }

    const addrUuid = `addr-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    if (isDefault) {
      await db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [req.user!.dbId]);
    }
    await db.execute(
      `INSERT INTO user_addresses (uuid, user_id, label, recipient_name, phone, address_line, district, area_id, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [addrUuid, req.user!.dbId, label, recipientName, phone, addressLine, district, areaId, isDefault ? 1 : 0]
    );

    const updatedRow = await db.get('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user!.dbId]);
    const formatted = await formatUserFromRow(db, updatedRow);
    const { dbId, ...publicUser } = formatted;
    return res.json({ success: true, user: publicUser });
  });

  app.delete('/api/account/addresses/:addressId', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    const addressId = sanitizeText(req.params.addressId, 60);
    await db.execute('DELETE FROM user_addresses WHERE user_id = ? AND (uuid = ? OR id = ?)', [
      req.user!.dbId,
      addressId,
      addressId,
    ]);
    const updatedRow = await db.get('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user!.dbId]);
    const formatted = await formatUserFromRow(db, updatedRow);
    const { dbId, ...publicUser } = formatted;
    return res.json({ success: true, user: publicUser });
  });

  // Persist placed order in database
  app.post('/api/orders', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const order: any = req.body?.order;
      if (!order || !order.orderNumber || !Array.isArray(order.items) || order.items.length === 0) {
        return res.status(400).json({ error: 'Invalid order payload.' });
      }

      await db.transaction(async () => {
        const ordRes = await db.execute(
          `INSERT INTO orders (
            uuid, order_number, user_id, customer_name, customer_email, customer_phone,
            shipping_address_line, shipping_district, shipping_area,
            delivery_zone_id, delivery_zone_name, delivery_fee,
            subtotal, coupon_code, coupon_discount, loyalty_points_used, loyalty_discount,
            grand_total, order_status, payment_status,
            payment_method_id, payment_method_name, payment_method_type,
            payment_recipient_number, payment_account_type, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sanitizeText(order.id, 60),
            sanitizeText(order.orderNumber, 40),
            req.user!.dbId,
            sanitizeText(order.customerName, 120),
            sanitizeText(order.customerEmail, 191),
            sanitizeText(order.customerPhone, 30),
            sanitizeText(order.deliveryAddressSnapshot?.addressLine, 500),
            sanitizeText(order.deliveryAddressSnapshot?.district, 60),
            sanitizeText(order.deliveryAddressSnapshot?.areaName, 120),
            sanitizeText(order.deliveryZoneSnapshot?.id, 60),
            sanitizeText(order.deliveryZoneSnapshot?.name, 120),
            Number(order.deliveryFee ?? 0),
            Number(order.subtotal ?? 0),
            order.couponCodeApplied ? sanitizeText(order.couponCodeApplied, 50) : null,
            Number(order.couponDiscount ?? 0),
            Number(order.loyaltyPointsUsed ?? 0),
            Number(order.loyaltyDiscount ?? 0),
            Number(order.grandTotal ?? 0),
            sanitizeText(order.orderStatus || 'pending', 40),
            sanitizeText(order.paymentStatus || 'unpaid', 40),
            sanitizeText(order.paymentMethodId, 60),
            sanitizeText(order.paymentMethodSnapshot?.name, 100),
            sanitizeText(order.paymentMethodSnapshot?.type, 40),
            sanitizeText(order.paymentMethodSnapshot?.recipientNumber, 60),
            sanitizeText(order.paymentMethodSnapshot?.accountType, 40),
            sanitizeText(order.createdAt || new Date().toISOString(), 40),
          ]
        );

        const orderDbId = Number(ordRes.insertId);

        for (const item of order.items) {
          await db.execute(
            `INSERT INTO order_items (
              order_id, product_id, variant_id, product_name, sku, color_name, size, unit_price, quantity, line_total, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              orderDbId,
              sanitizeText(item.productId, 60),
              sanitizeText(item.variantId, 60),
              sanitizeText(item.productName, 180),
              sanitizeText(item.sku, 60),
              sanitizeText(item.colorName, 60),
              sanitizeText(item.size, 10),
              Number(item.unitPrice ?? 0),
              Number(item.quantity ?? 1),
              Number(item.lineTotal ?? 0),
              String(item.imageUrl || ''),
            ]
          );

          // Decrement stock in DB
          await db.execute(
            `UPDATE product_variants SET stock_quantity = MAX(0, stock_quantity - ?) WHERE code_id = ? OR sku = ?`,
            [Number(item.quantity ?? 1), sanitizeText(item.variantId, 60), sanitizeText(item.sku, 60)]
          ).catch(async () => {
            await db.execute(
              `UPDATE product_variants SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE code_id = ? OR sku = ?`,
              [Number(item.quantity ?? 1), sanitizeText(item.variantId, 60), sanitizeText(item.sku, 60)]
            );
          });
        }

        if (order.paymentClaim) {
          const c = order.paymentClaim;
          await db.execute(
            `INSERT INTO payments (
              uuid, order_id, payment_method_id, payment_method_name, sender_phone, transaction_id, amount_claimed, customer_notes, status, submitted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sanitizeText(c.id, 60),
              orderDbId,
              sanitizeText(c.paymentMethodId, 60),
              sanitizeText(c.paymentMethodName, 100),
              sanitizeText(c.senderPhone, 30),
              sanitizeText(c.transactionId, 100),
              Number(c.amountClaimed ?? order.grandTotal ?? 0),
              c.customerNotes ? sanitizeText(c.customerNotes, 500) : null,
              order.paymentStatus === 'verified' ? 'verified' : 'awaiting_verification',
              sanitizeText(c.submittedAt || new Date().toISOString(), 40),
            ]
          );
        }

        if (Array.isArray(order.statusHistory)) {
          for (const h of order.statusHistory) {
            await db.execute(
              `INSERT INTO order_status_history (uuid, order_id, from_status, to_status, note, actor, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                sanitizeText(h.id, 60),
                orderDbId,
                sanitizeText(h.fromStatus, 40),
                sanitizeText(h.toStatus, 40),
                sanitizeText(h.note, 500),
                sanitizeText(h.actor, 120),
                sanitizeText(h.timestamp || new Date().toISOString(), 40),
              ]
            );
          }
        }

        if (order.couponCodeApplied) {
          await db.execute(`UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = ?`, [
            String(order.couponCodeApplied).toUpperCase(),
          ]);
        }

        if (Number(order.loyaltyPointsUsed ?? 0) > 0) {
          const pts = Number(order.loyaltyPointsUsed);
          const newBal = Math.max(0, req.user!.loyaltyPoints - pts);
          await db.execute(`UPDATE users SET loyalty_points = ? WHERE id = ?`, [newBal, req.user!.dbId]);
          await db.execute(
            `INSERT INTO loyalty_transactions (uuid, user_id, order_id, points_delta, balance_after, type, reason, created_at)
             VALUES (?, ?, ?, ?, ?, 'redeem', ?, ?)`,
            [
              `ltx-${Date.now()}`,
              req.user!.dbId,
              sanitizeText(order.id, 60),
              -pts,
              newBal,
              `Redeemed points on Order #${order.orderNumber}`,
              new Date().toISOString(),
            ]
          );
        }
      });

      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('[POST /api/orders] Error:', err);
      return res.status(500).json({ error: 'Failed to record order.' });
    }
  });

  // Public Order Tracking Lookup
  app.post('/api/orders/track', async (req: Request, res: Response) => {
    try {
      const orderQuery = sanitizeText(req.body?.orderQuery, 60).replace(/^#/, '').toUpperCase();
      const phoneOrEmail = sanitizeText(req.body?.phoneOrEmail, 191).toLowerCase();

      if (!orderQuery) {
        return res.status(400).json({ success: false, error: 'Please enter your Order Number.' });
      }

      const allOrders = await loadAllOrders(db);
      const matched = allOrders.find(
        o => o.orderNumber.toUpperCase() === orderQuery || o.id.toUpperCase() === orderQuery
      );

      if (!matched) {
        return res.status(404).json({
          success: false,
          error: `No order found matching "${orderQuery}".`,
        });
      }

      if (phoneOrEmail) {
        const cleanQueryDigits = phoneOrEmail.replace(/\D/g, '');
        const orderPhoneDigits = matched.customerPhone.replace(/\D/g, '');
        const recipientPhoneDigits = matched.deliveryAddressSnapshot.phone.replace(/\D/g, '');
        const emailMatch = matched.customerEmail.toLowerCase() === phoneOrEmail;
        const phoneMatch =
          cleanQueryDigits.length >= 6 &&
          (orderPhoneDigits.endsWith(cleanQueryDigits) || recipientPhoneDigits.endsWith(cleanQueryDigits));

        if (!emailMatch && !phoneMatch) {
          return res.status(403).json({
            success: false,
            error: 'Order found, but the phone number or email provided does not match the billing record.',
          });
        }
      }

      return res.json({ success: true, order: matched });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Unable to track order right now.' });
    }
  });

  // Customer Payment Claim submission
  app.post('/api/orders/:orderId/payment-claim', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = sanitizeText(req.params.orderId, 60);
      const senderPhone = sanitizeText(req.body?.senderPhone, 30);
      const transactionId = sanitizeText(req.body?.transactionId, 100).toUpperCase();
      const customerNotes = sanitizeText(req.body?.customerNotes, 500);

      const ordRow = await db.get('SELECT * FROM orders WHERE uuid = ? OR order_number = ? LIMIT 1', [
        orderId,
        orderId,
      ]);
      if (!ordRow) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      if (Number(ordRow.user_id) !== req.user!.dbId && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to modify this order.' });
      }

      await db.execute('DELETE FROM payments WHERE order_id = ?', [ordRow.id]);
      await db.execute(
        `INSERT INTO payments (
          uuid, order_id, payment_method_id, payment_method_name, sender_phone, transaction_id, amount_claimed, customer_notes, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_verification', ?)`,
        [
          `claim-${Date.now()}`,
          ordRow.id,
          ordRow.payment_method_id,
          ordRow.payment_method_name,
          senderPhone,
          transactionId,
          ordRow.grand_total,
          customerNotes || null,
          new Date().toISOString(),
        ]
      );
      await db.execute(`UPDATE orders SET payment_status = 'awaiting_verification' WHERE id = ?`, [ordRow.id]);

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to submit payment claim.' });
    }
  });

  // Customer Reviews
  app.post('/api/reviews', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const review = req.body?.review;
      if (!review || !review.productId || !review.comment) {
        return res.status(400).json({ error: 'Invalid review data.' });
      }
      await db.execute('DELETE FROM product_reviews WHERE product_id = ? AND user_id = ?', [
        sanitizeText(review.productId, 60),
        req.user!.id,
      ]);
      await db.execute(
        `INSERT INTO product_reviews (uuid, product_id, user_id, user_name, user_email, rating, title, comment, verified_purchase, helpful_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sanitizeText(review.id || `rev-${Date.now()}`, 60),
          sanitizeText(review.productId, 60),
          req.user!.id,
          req.user!.name,
          req.user!.email,
          Math.min(5, Math.max(1, Number(review.rating ?? 5))),
          review.title ? sanitizeText(review.title, 200) : null,
          sanitizeText(review.comment, 2000),
          review.verifiedPurchase ? 1 : 0,
          Number(review.helpfulCount ?? 0),
          new Date().toISOString(),
        ]
      );
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save review.' });
    }
  });

  app.delete('/api/reviews/:reviewId', requireAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
    const reviewId = sanitizeText(req.params.reviewId, 60);
    const row = await db.get('SELECT * FROM product_reviews WHERE uuid = ? LIMIT 1', [reviewId]);
    if (!row) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    if (req.user!.role !== 'admin' && String(row.user_id) !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    if (req.user!.role === 'admin' && req.user!.mustChangePassword) {
      return res.status(403).json({ error: 'PASSWORD_CHANGE_REQUIRED', mustChangePassword: true });
    }
    await db.execute('DELETE FROM product_reviews WHERE uuid = ?', [reviewId]);
    return res.json({ success: true });
  });

  // ============================================================================
  // 4. PROTECTED ADMIN API ENDPOINTS (Enforces requireAuth + requireCsrf + requireAdmin)
  // ============================================================================

  // Admin User Management: List Users
  app.get('/api/admin/users', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await loadAllUsers(db);
      return res.json({ success: true, users });
    } catch (err) {
      console.error('[GET /api/admin/users] Error:', err);
      return res.status(500).json({ error: 'Failed to load user accounts.' });
    }
  });

  // Admin User Management: Create or Update User
  app.post('/api/admin/users', requireAuth, requireCsrf, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userPayload = req.body?.user;
      const isNew = Boolean(req.body?.isNew);
      const initialPassword = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

      const id = sanitizeText(userPayload?.id, 60) || `user-${Date.now()}`;
      const name = sanitizeText(userPayload?.name, 120);
      const email = sanitizeText(userPayload?.email, 191).toLowerCase();
      const phone = sanitizeText(userPayload?.phone, 30);
      const role = userPayload?.role === 'admin' ? 'admin' : 'customer';
      const status = ['active', 'suspended', 'archived'].includes(userPayload?.status)
        ? userPayload.status
        : 'active';
      const notes = userPayload?.notes ? sanitizeText(userPayload.notes, 1000) : null;
      const loyaltyPoints = Math.max(0, Math.round(Number(userPayload?.loyaltyPoints ?? 0)));

      if (!name || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Valid name and email address are required.' });
      }

      const existingByUuid = await db.get('SELECT * FROM users WHERE uuid = ? LIMIT 1', [id]);
      const emailConflict = await db.get(
        'SELECT id, name, uuid FROM users WHERE LOWER(email) = ? AND uuid != ? LIMIT 1',
        [email, id]
      );
      if (emailConflict) {
        return res.status(409).json({ error: `Email "${email}" is already assigned to ${emailConflict.name}.` });
      }

      if (existingByUuid) {
        // Prevent demoting or suspending the last active admin
        if (existingByUuid.role === 'admin' && (role !== 'admin' || status !== 'active')) {
          const otherAdmins = await db.get<{ cnt: number }>(
            `SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND status = 'active' AND id != ?`,
            [existingByUuid.id]
          );
          if (Number(otherAdmins?.cnt ?? 0) === 0) {
            return res.status(400).json({
              error: 'Cannot demote or deactivate the only active administrator account.',
            });
          }
        }

        if (initialPassword && initialPassword.length >= 8) {
          const newHash = await bcrypt.hash(initialPassword, 12);
          await db.execute(
            `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ?, notes = ?, loyalty_points = ?, password_hash = ?, must_change_password = ?
             WHERE id = ?`,
            [name, email, phone, role, status, notes, loyaltyPoints, newHash, role === 'admin' ? 1 : 0, existingByUuid.id]
          );
        } else {
          await db.execute(
            `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ?, notes = ?, loyalty_points = ?
             WHERE id = ?`,
            [name, email, phone, role, status, notes, loyaltyPoints, existingByUuid.id]
          );
        }
      } else {
        const rawPwd = initialPassword && initialPassword.length >= 8 ? initialPassword : crypto.randomBytes(12).toString('hex');
        const pwdHash = await bcrypt.hash(rawPwd, 12);
        const mustChange = role === 'admin' ? 1 : 0;
        await db.execute(
          `INSERT INTO users (uuid, name, email, phone, password_hash, role, status, must_change_password, notes, loyalty_points, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, name, email, phone, pwdHash, role, status, mustChange, notes, loyaltyPoints, new Date().toISOString()]
        );
      }

      await db.execute(
        `INSERT INTO admin_audit_logs (uuid, actor_name, actor_role, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, ?, ?, 'USER', ?, ?, ?)`,
        [
          `audit-${Date.now()}`,
          req.user!.name,
          req.user!.role,
          isNew || !existingByUuid ? 'CREATE_USER' : 'UPDATE_USER',
          id,
          `${isNew || !existingByUuid ? 'Created' : 'Updated'} user "${name}" (${email}) [Role: ${role}, Status: ${status}]`,
          new Date().toISOString(),
        ]
      );

      const users = await loadAllUsers(db);
      return res.json({ success: true, users });
    } catch (err) {
      console.error('[POST /api/admin/users] Error:', err);
      return res.status(500).json({ error: 'Failed to save user account.' });
    }
  });

  app.patch('/api/admin/users/:userId/status', requireAuth, requireCsrf, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const userId = sanitizeText(req.params.userId, 60);
    const status = ['active', 'suspended', 'archived'].includes(req.body?.status) ? req.body.status : 'active';
    const target = await db.get('SELECT * FROM users WHERE uuid = ? LIMIT 1', [userId]);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (target.role === 'admin' && status !== 'active') {
      const otherAdmins = await db.get<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND status = 'active' AND id != ?`,
        [target.id]
      );
      if (Number(otherAdmins?.cnt ?? 0) === 0) {
        return res.status(400).json({ error: 'Cannot suspend or archive the last active administrator.' });
      }
    }
    await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, target.id]);
    if (status !== 'active') {
      await db.execute('DELETE FROM user_sessions WHERE user_id = ?', [target.id]);
    }
    const users = await loadAllUsers(db);
    return res.json({ success: true, users });
  });

  app.delete('/api/admin/users/:userId', requireAuth, requireCsrf, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const userId = sanitizeText(req.params.userId, 60);
    if (req.user!.id === userId) {
      return res.status(400).json({ error: 'Cannot delete the currently logged-in administrator account.' });
    }
    const target = await db.get('SELECT * FROM users WHERE uuid = ? LIMIT 1', [userId]);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (target.role === 'admin') {
      const otherAdmins = await db.get<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND id != ?`,
        [target.id]
      );
      if (Number(otherAdmins?.cnt ?? 0) === 0) {
        return res.status(400).json({ error: 'Cannot delete the last remaining administrator account.' });
      }
    }
    await db.execute('DELETE FROM user_sessions WHERE user_id = ?', [target.id]);
    await db.execute('DELETE FROM user_addresses WHERE user_id = ?', [target.id]);
    await db.execute('DELETE FROM users WHERE id = ?', [target.id]);
    const users = await loadAllUsers(db);
    return res.json({ success: true, users });
  });

  // Admin State Synchronization Endpoint (persists catalog, orders, zones, settings, etc. via prepared SQL)
  app.post('/api/admin/sync', requireAuth, requireCsrf, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type, payload } = req.body || {};

      if (type === 'site_settings' && payload) {
        await db.execute('DELETE FROM site_settings WHERE key = ?', ['site_settings']);
        await db.execute('INSERT INTO site_settings (key, value) VALUES (?, ?)', [
          'site_settings',
          JSON.stringify(payload),
        ]);
      } else if (type === 'smtp_settings' && payload) {
        await db.execute('DELETE FROM site_settings WHERE key = ?', ['smtp_settings']);
        await db.execute('INSERT INTO site_settings (key, value) VALUES (?, ?)', [
          'smtp_settings',
          JSON.stringify(payload),
        ]);
      } else if (type === 'email_templates' && payload) {
        await db.execute('DELETE FROM site_settings WHERE key = ?', ['email_templates']);
        await db.execute('INSERT INTO site_settings (key, value) VALUES (?, ?)', [
          'email_templates',
          JSON.stringify(payload),
        ]);
      } else if (type === 'webhook_config' && payload) {
        await db.execute('DELETE FROM site_settings WHERE key = ?', ['webhook_config']);
        await db.execute('INSERT INTO site_settings (key, value) VALUES (?, ?)', [
          'webhook_config',
          JSON.stringify(payload),
        ]);
      } else if (type === 'order_update' && payload) {
        const ordRow = await db.get('SELECT * FROM orders WHERE uuid = ? OR order_number = ? LIMIT 1', [
          sanitizeText(payload.id, 60),
          sanitizeText(payload.orderNumber, 40),
        ]);
        if (ordRow) {
          await db.execute(
            `UPDATE orders SET order_status = ?, payment_status = ?, carrier_name = ?, tracking_number = ? WHERE id = ?`,
            [
              sanitizeText(payload.orderStatus, 40),
              sanitizeText(payload.paymentStatus, 40),
              payload.carrierName ? sanitizeText(payload.carrierName, 100) : null,
              payload.trackingNumber ? sanitizeText(payload.trackingNumber, 100) : null,
              ordRow.id,
            ]
          );
          if (payload.paymentClaim) {
            const c = payload.paymentClaim;
            await db.execute(
              `UPDATE payments SET status = ?, verified_by = ?, verified_at = ?, rejection_reason = ?, admin_notes = ? WHERE order_id = ?`,
              [
                payload.paymentStatus === 'verified'
                  ? 'verified'
                  : payload.paymentStatus === 'rejected'
                  ? 'rejected'
                  : 'awaiting_verification',
                c.verifiedBy ? sanitizeText(c.verifiedBy, 120) : null,
                c.verifiedAt ? sanitizeText(c.verifiedAt, 40) : null,
                c.rejectionReason ? sanitizeText(c.rejectionReason, 500) : null,
                c.adminNotes ? sanitizeText(c.adminNotes, 500) : null,
                ordRow.id,
              ]
            );
          }
          if (Array.isArray(payload.statusHistory)) {
            await db.execute('DELETE FROM order_status_history WHERE order_id = ?', [ordRow.id]);
            for (const h of payload.statusHistory) {
              await db.execute(
                `INSERT INTO order_status_history (uuid, order_id, from_status, to_status, note, actor, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  sanitizeText(h.id, 60),
                  ordRow.id,
                  sanitizeText(h.fromStatus, 40),
                  sanitizeText(h.toStatus, 40),
                  sanitizeText(h.note, 500),
                  sanitizeText(h.actor, 120),
                  sanitizeText(h.timestamp || new Date().toISOString(), 40),
                ]
              );
            }
          }
        }
      } else if (type === 'variant_stock' && payload) {
        await db.execute(`UPDATE product_variants SET stock_quantity = ? WHERE code_id = ?`, [
          Math.max(0, Number(payload.newStock ?? 0)),
          sanitizeText(payload.variantId, 60),
        ]);
      } else if (type === 'product_save' && payload) {
        const p = payload;
        const catRow = await db.get('SELECT id FROM categories WHERE code_id = ? LIMIT 1', [
          sanitizeText(p.categoryId, 60),
        ]);
        const catDbId = Number(catRow?.id ?? 1);
        const existingProd = await db.get('SELECT id FROM products WHERE code_id = ? LIMIT 1', [
          sanitizeText(p.id, 60),
        ]);

        let prodDbId: number;
        if (existingProd) {
          prodDbId = Number(existingProd.id);
          await db.execute(
            `UPDATE products SET category_id = ?, name = ?, slug = ?, description = ?, short_description = ?,
             base_price = ?, is_featured = ?, status = ?, fabric_weight = ?, fit_type = ?, care_instructions = ?,
             seo_title = ?, seo_description = ? WHERE id = ?`,
            [
              catDbId,
              sanitizeText(p.name, 180),
              sanitizeText(p.slug, 200),
              String(p.description || ''),
              sanitizeText(p.shortDescription, 300),
              Number(p.basePrice ?? 0),
              p.isFeatured ? 1 : 0,
              sanitizeText(p.status || 'published', 40),
              sanitizeText(p.fabricWeight, 100),
              sanitizeText(p.fitType, 60),
              String(p.careInstructions || ''),
              p.seoTitle ? sanitizeText(p.seoTitle, 200) : null,
              p.seoDescription ? sanitizeText(p.seoDescription, 300) : null,
              prodDbId,
            ]
          );
          await db.execute('DELETE FROM product_variants WHERE product_id = ?', [prodDbId]);
          await db.execute('DELETE FROM product_variant_images WHERE product_id = ?', [prodDbId]);
        } else {
          const ins = await db.execute(
            `INSERT INTO products (
              code_id, category_id, name, slug, description, short_description,
              base_price, is_featured, status, fabric_weight, fit_type,
              care_instructions, seo_title, seo_description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sanitizeText(p.id, 60),
              catDbId,
              sanitizeText(p.name, 180),
              sanitizeText(p.slug, 200),
              String(p.description || ''),
              sanitizeText(p.shortDescription, 300),
              Number(p.basePrice ?? 0),
              p.isFeatured ? 1 : 0,
              sanitizeText(p.status || 'published', 40),
              sanitizeText(p.fabricWeight, 100),
              sanitizeText(p.fitType, 60),
              String(p.careInstructions || ''),
              p.seoTitle ? sanitizeText(p.seoTitle, 200) : null,
              p.seoDescription ? sanitizeText(p.seoDescription, 300) : null,
              sanitizeText(p.createdAt || new Date().toISOString(), 40),
            ]
          );
          prodDbId = Number(ins.insertId);
        }

        if (Array.isArray(p.variants)) {
          for (const v of p.variants) {
            await db.execute(
              `INSERT INTO product_variants (code_id, product_id, color_name, color_hex, size, sku, price_override, stock_quantity, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sanitizeText(v.id, 60),
                prodDbId,
                sanitizeText(v.colorName, 60),
                sanitizeText(v.colorHex, 10),
                sanitizeText(v.size, 10),
                sanitizeText(v.sku, 60),
                v.priceOverride !== null && v.priceOverride !== undefined ? Number(v.priceOverride) : null,
                Number(v.stockQuantity ?? 0),
                v.isActive ? 1 : 0,
              ]
            );
          }
        }

        if (Array.isArray(p.images)) {
          for (const img of p.images) {
            await db.execute(
              `INSERT INTO product_variant_images (code_id, product_id, color_name, image_url, alt_text, is_primary, display_order)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                sanitizeText(img.id, 60),
                prodDbId,
                sanitizeText(img.colorName, 60),
                String(img.imageUrl || ''),
                sanitizeText(img.altText, 200),
                img.isPrimary ? 1 : 0,
                Number(img.displayOrder ?? 1),
              ]
            );
          }
        }
      } else if (type === 'product_delete' && payload?.productId) {
        const existingProd = await db.get('SELECT id FROM products WHERE code_id = ? LIMIT 1', [
          sanitizeText(payload.productId, 60),
        ]);
        if (existingProd) {
          await db.execute('DELETE FROM product_variants WHERE product_id = ?', [existingProd.id]);
          await db.execute('DELETE FROM product_variant_images WHERE product_id = ?', [existingProd.id]);
          await db.execute('DELETE FROM products WHERE id = ?', [existingProd.id]);
        }
      } else if (type === 'delivery_zone_save' && payload) {
        const z = payload;
        const existing = await db.get('SELECT id FROM delivery_zones WHERE code_id = ? LIMIT 1', [
          sanitizeText(z.id, 60),
        ]);
        if (existing) {
          await db.execute(
            `UPDATE delivery_zones SET name = ?, fee = ?, estimated_delivery_time = ?, is_active = ?, display_order = ? WHERE id = ?`,
            [
              sanitizeText(z.name, 120),
              Number(z.fee ?? 0),
              sanitizeText(z.estimatedDeliveryTime, 60),
              z.isActive ? 1 : 0,
              Number(z.displayOrder ?? 1),
              existing.id,
            ]
          );
        } else {
          await db.execute(
            `INSERT INTO delivery_zones (code_id, name, fee, estimated_delivery_time, is_active, display_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              sanitizeText(z.id, 60),
              sanitizeText(z.name, 120),
              Number(z.fee ?? 0),
              sanitizeText(z.estimatedDeliveryTime, 60),
              z.isActive ? 1 : 0,
              Number(z.displayOrder ?? 1),
            ]
          );
        }
      } else if (type === 'delivery_zone_delete' && payload?.zoneId) {
        await db.execute('DELETE FROM delivery_zones WHERE code_id = ?', [sanitizeText(payload.zoneId, 60)]);
      } else if (type === 'delivery_area_save' && payload) {
        const a = payload;
        const zRow = await db.get('SELECT id FROM delivery_zones WHERE code_id = ? LIMIT 1', [
          sanitizeText(a.zoneId, 60),
        ]);
        const zDbId = Number(zRow?.id ?? 1);
        const existing = await db.get('SELECT id FROM delivery_areas WHERE code_id = ? LIMIT 1', [
          sanitizeText(a.id, 60),
        ]);
        if (existing) {
          await db.execute(
            `UPDATE delivery_areas SET zone_id = ?, district_name = ?, area_name = ? WHERE id = ?`,
            [zDbId, sanitizeText(a.districtName, 60), sanitizeText(a.areaName, 120), existing.id]
          );
        } else {
          await db.execute(
            `INSERT INTO delivery_areas (code_id, zone_id, district_name, area_name) VALUES (?, ?, ?, ?)`,
            [sanitizeText(a.id, 60), zDbId, sanitizeText(a.districtName, 60), sanitizeText(a.areaName, 120)]
          );
        }
      } else if (type === 'delivery_area_delete' && payload?.areaId) {
        await db.execute('DELETE FROM delivery_areas WHERE code_id = ?', [sanitizeText(payload.areaId, 60)]);
      } else if (type === 'payment_method_save' && payload) {
        const pm = payload;
        const existing = await db.get('SELECT id FROM payment_methods WHERE code = ? LIMIT 1', [
          sanitizeText(pm.id, 40),
        ]);
        if (existing) {
          await db.execute(
            `UPDATE payment_methods SET name = ?, type = ?, recipient_number = ?, account_type = ?, instructions = ?, is_enabled = ?, display_order = ? WHERE id = ?`,
            [
              sanitizeText(pm.name, 100),
              sanitizeText(pm.type, 40),
              sanitizeText(pm.recipientNumber, 60),
              sanitizeText(pm.accountType, 40),
              String(pm.instructions || ''),
              pm.isEnabled ? 1 : 0,
              Number(pm.displayOrder ?? 1),
              existing.id,
            ]
          );
        } else {
          await db.execute(
            `INSERT INTO payment_methods (code, name, type, recipient_number, account_type, instructions, is_enabled, display_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sanitizeText(pm.id, 40),
              sanitizeText(pm.name, 100),
              sanitizeText(pm.type, 40),
              sanitizeText(pm.recipientNumber, 60),
              sanitizeText(pm.accountType, 40),
              String(pm.instructions || ''),
              pm.isEnabled ? 1 : 0,
              Number(pm.displayOrder ?? 1),
            ]
          );
        }
      } else if (type === 'payment_method_delete' && payload?.pmId) {
        await db.execute('DELETE FROM payment_methods WHERE code = ?', [sanitizeText(payload.pmId, 40)]);
      } else if (type === 'coupon_save' && payload) {
        const cp = payload;
        const existing = await db.get('SELECT id FROM coupons WHERE code_id = ? LIMIT 1', [
          sanitizeText(cp.id, 60),
        ]);
        if (existing) {
          await db.execute(
            `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_order_amount = ?, max_discount_amount = ?,
             usage_limit_global = ?, usage_limit_per_user = ?, used_count = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ?`,
            [
              sanitizeText(cp.code, 50),
              sanitizeText(cp.discountType, 20),
              Number(cp.discountValue ?? 0),
              Number(cp.minOrderAmount ?? 0),
              cp.maxDiscountAmount !== undefined ? Number(cp.maxDiscountAmount) : null,
              Number(cp.usageLimitGlobal ?? 100),
              Number(cp.usageLimitPerUser ?? 1),
              Number(cp.usedCount ?? 0),
              sanitizeText(cp.startDate, 20),
              sanitizeText(cp.endDate, 20),
              cp.isActive ? 1 : 0,
              existing.id,
            ]
          );
        } else {
          await db.execute(
            `INSERT INTO coupons (code_id, code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit_global, usage_limit_per_user, used_count, start_date, end_date, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sanitizeText(cp.id, 60),
              sanitizeText(cp.code, 50),
              sanitizeText(cp.discountType, 20),
              Number(cp.discountValue ?? 0),
              Number(cp.minOrderAmount ?? 0),
              cp.maxDiscountAmount !== undefined ? Number(cp.maxDiscountAmount) : null,
              Number(cp.usageLimitGlobal ?? 100),
              Number(cp.usageLimitPerUser ?? 1),
              Number(cp.usedCount ?? 0),
              sanitizeText(cp.startDate, 20),
              sanitizeText(cp.endDate, 20),
              cp.isActive ? 1 : 0,
            ]
          );
        }
      } else if (type === 'coupon_delete' && payload?.couponId) {
        await db.execute('DELETE FROM coupons WHERE code_id = ?', [sanitizeText(payload.couponId, 60)]);
      } else if (type === 'audit_log' && payload) {
        await db.execute(
          `INSERT INTO admin_audit_logs (uuid, actor_name, actor_role, action, entity_type, entity_id, details, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sanitizeText(payload.id || `audit-${Date.now()}`, 60),
            req.user!.name,
            req.user!.role,
            sanitizeText(payload.action, 60),
            sanitizeText(payload.entityType, 60),
            sanitizeText(payload.entityId, 60),
            sanitizeText(payload.details, 1000),
            sanitizeText(payload.timestamp || new Date().toISOString(), 40),
          ]
        );
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('[POST /api/admin/sync] Error:', err);
      return res.status(500).json({ error: 'Admin sync operation failed.' });
    }
  });

  // Healthcheck endpoint for cPanel / Passenger / uptime monitors
  app.get('/api/health', (_req: Request, res: Response) => {
    return res.json({
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      databaseDialect: db.dialect,
      timestamp: new Date().toISOString(),
    });
  });

  // Catch-all for unmatched /api/* routes so API requests never return index.html
  app.use('/api', (_req: Request, res: Response) => {
    return res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Vite middleware for development / static serving for production (cPanel / Phusion Passenger)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false, maxAge: '1d' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ThreadCraft V2] Full-Stack Server (${process.env.NODE_ENV || 'development'}) listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start ThreadCraft V2 server:', err);
  process.exit(1);
});
