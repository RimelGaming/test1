# ThreadCraft V2 — Phase 1: Production-Readiness Overhaul (Auth, Security & Demo Removal)

## 1. Overview & Architecture
This plan outlines **Phase 1 of 3** to make **ThreadCraft V2** production-ready while preserving all working e-commerce, checkout, payment verification, webhook, SMTP mailer, and admin features.

- **Full-Stack Express + MySQL-Compatible Database Layer (`server.ts` + `/database/migrations/001_initial_schema.sql` + `/php-app`)**:
  - Introduce a production-grade Node/Express backend (`server.ts`) running on port 3000 with Vite middleware for local/preview execution and a parameterized SQL persistence engine (`mysql2/promise` when `DB_HOST` is configured, with seamless automatic fallback to a local SQLite prepared-statement engine in the AI Studio container if an external MySQL daemon is not reachable, plus updated MySQL schema & PHP backend scripts in `/database` and `/php-app`).
  - All SQL queries across both `server.ts` and `/php-app` will use strict prepared statements (`?` placeholders) with zero string interpolation.

---

## 2. Database Schema & Bootstrap Seeding

### Schema Updates (`/database/migrations/001_initial_schema.sql` & Server DB Init)
- **`users` Table**:
  - Add `must_change_password TINYINT(1) NOT NULL DEFAULT 0` column.
  - Ensure `role` defaults strictly to `'customer'` and `status` defaults to `'active'`.
- **Sessions & Security**:
  - Add `user_sessions` table (`session_id`, `user_id`, `csrf_token`, `ip_address`, `user_agent`, `expires_at`, `created_at`) for server-side HTTP-only session validation and CSRF token binding.

### Bootstrap Admin & Storefront Seeding
- **Bootstrap Admin Provisioning**:
  - On server startup, query `SELECT COUNT(*) FROM users WHERE role = 'admin'`.
  - **Only if zero admin records exist**, read `INITIAL_ADMIN_EMAIL` (documented in `.env.example` as `admin@gmail.com`) and `INITIAL_ADMIN_PASSWORD` (documented in `.env.example` as `admin123`) from environment variables, hash the password with `bcryptjs` (cost factor 12), and insert a single admin user with `role = 'admin'` and `must_change_password = 1`.
  - Never overwrite or reset an existing admin account.
- **Storefront Catalog Seeding**:
  - **Only if the `products` table is completely empty**, seed the initial categories, products, variants, delivery zones/areas, payment methods, coupons, site settings, static pages, and journal posts so a fresh install has a working storefront without overwriting existing catalog data.
  - **Zero Demo Accounts or Fake Activity**: Do not seed any demo customer accounts (`Fahim Rahman`, `Nusrat Jahan`), fake orders, fake payment claims, fake audit logs, or demo product reviews.

---

## 3. Backend Authentication & Admin Security (`server.ts` & `/php-app`)

### Public Registration & Login (`/api/auth/*`)
- **`POST /api/auth/register`**:
  - Validate and sanitize `name`, `email`, `phone`, and `password` (minimum 8 characters).
  - Explicitly ignore any `role`, `status`, `loyaltyPoints`, or privilege fields in `req.body` — always assign `role = 'customer'` and `must_change_password = 0` server-side.
  - Hash password with `bcryptjs` and create an authenticated HTTP-only session.
- **`POST /api/auth/login`**:
  - Protected by `express-rate-limit` (e.g., max 10 attempts per 15 minutes per IP) to prevent brute-force attacks.
  - Verify credentials against `password_hash` using `bcrypt.compare`.
  - Block login if `user.status === 'suspended'` or `'archived'`.
  - Issue an `HttpOnly` session cookie (`SameSite=Lax` / iframe-safe `SameSite=None; Secure` when over HTTPS) and return `{ user, csrfToken }` (never returning `password_hash`).
- **`POST /api/auth/logout`** & **`GET /api/auth/me`**:
  - Verify the active server session cookie; return `401` if unauthenticated or expired.
- **`POST /api/auth/change-password`**:
  - Requires an authenticated session and valid CSRF token.
  - Verifies `currentPassword`, validates `newPassword` (minimum 8 characters, must differ from `currentPassword`), updates `password_hash`, sets `must_change_password = 0`, and logs the security event.

### Middleware & Route Protection
- **`requireAuth` Middleware**: Validates the HTTP-only session cookie against `user_sessions` and attaches the verified `req.user` from the database.
- **`requireCsrf` Middleware**: Enforces matching `X-CSRF-Token` header on all state-mutating (`POST`, `PUT`, `PATCH`, `DELETE`) authenticated requests.
- **`requireAdmin` Middleware**:
  - Enforces `req.user.role === 'admin'` (`403 Forbidden` otherwise).
  - Enforces `req.user.mustChangePassword === false` — if `must_change_password` is true, returns `403 { error: 'PASSWORD_CHANGE_REQUIRED', mustChangePassword: true }` on all protected admin routes until the password is changed.
- **API Endpoints**:
  - Public Storefront API (`GET /api/bootstrap`, `POST /api/orders`, `POST /api/orders/track`, `POST /api/webhooks/payment`, etc.).
  - Authenticated Customer API (`PUT /api/account/profile`, `POST /api/account/addresses`, `DELETE /api/account/addresses/:id`, `POST /api/orders/:id/payment-claim`, `POST /api/reviews`).
  - Protected Admin API (`/api/admin/*` covering products, categories, stock, orders, payment verification, delivery zones/areas, payment methods, coupons, users, loyalty points, site settings, SMTP/templates, news, and static pages) guarded by `requireAuth`, `requireCsrf`, and `requireAdmin`.

---

## 4. Frontend Cleanup & Security Integration

### Remove All Demo & Bypass Logic
- **`/src/components/auth/AuthModal.tsx`**:
  - Remove the `⚡ Quick Demo 1-Click Sign In` section (`Customer Account` / `Admin Panel` buttons) and demo credential hints.
  - Add real password input fields to both Sign In and Create Account forms, wired to `POST /api/auth/login` and `POST /api/auth/register`.
- **`/src/components/layout/Navbar.tsx`**:
  - Remove the desktop and mobile `Customer | Admin` role-switcher toggle (`switchUserRole`).
  - Remove the `Reset Demo Data` (`resetToDefaultData`) button from both desktop and mobile menus.
  - Only show the `Admin Dashboard` link when the backend-verified `currentUser?.role === 'admin'`.
- **`/src/components/admin/AdminDashboard.tsx`**:
  - Remove the `Reset Demo State` button from the admin sidebar.
  - Remove hardcoded mock user passwords or demo fallback references in User Management.
- **`/src/context/StoreContext.tsx` & `/src/data/seedData.ts`**:
  - Remove auto-login of `initialUsers[1]` (`Fahim Rahman`), pre-populated cart items, and client-side role switching (`switchUserRole`) or demo resets (`resetToDefaultData`).
  - Initialize `currentUser` strictly from `GET /api/auth/me` and storefront state from `GET /api/bootstrap`.
  - Send `X-CSRF-Token` header and `credentials: 'include'` on all API mutations.
- **`/src/App.tsx` & Mandatory Password Change UI**:
  - Guard `currentView === 'admin'` strictly by checking `currentUser?.role === 'admin'`. Unauthenticated or non-admin users attempting to view `'admin'` are redirected to `'home'`.
  - When `currentUser?.mustChangePassword === true`, display a mandatory **First-Login Admin Password Update** screen/modal that blocks all admin dashboard operations until the admin sets a new password via `POST /api/auth/change-password`.
