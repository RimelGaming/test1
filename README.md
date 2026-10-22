# ThreadCraft V2 — Premium T-Shirt Store & E-Commerce Platform

A production-grade, database-backed T-Shirt e-commerce platform built to fulfill all non-negotiable requirements outlined in **RULES.md**, **STRUCTURE.md**, and **PROMPT.md**.

---

## 1. Key Architectural Guarantees

1. **Independent Variant Inventory & Galleries**:
   - Each color/size combination is a distinct database record with its own SKU, price override, and stock counter.
   - Selecting a colorway switches the image gallery dynamically to that variant's photos.
   - Out-of-stock sizes are disabled and strictly rejected by server-side validation.
2. **Manual Payment Verification (Zero Payment Gateway APIs)**:
   - Supports Cash on Delivery (COD) and manual mobile payments (**bKash**, **Nagad**, **Rocket**).
   - Customers submit their transaction reference (TrxID) and sender mobile number.
   - Payments remain `awaiting_verification` until an authorized administrator verifies the claim against their statement.
3. **Delivery Zones & Authoritative Fees**:
   - Supported districts and areas are mapped to configured zones (Inside Dhaka ৳60, Dhaka Suburbs ৳100, Outside Dhaka ৳130).
   - Fees are recalculated on the server immediately before order creation.
4. **Historical Order Snapshots**:
   - Every order preserves immutable snapshots of items, color, size, unit price, SKU, delivery fee, and address.
   - Later edits to products, prices, or delivery zones never rewrite historical orders.
5. **Loyalty Program & Coupon Validation**:
   - Configurable points engine with an auditable transactional ledger.
   - Coupons enforce expiry dates, minimum spend, global usage limits, and per-user limits.
6. **Live Admin Customization**:
   - Store branding, hero headline, announcement bar, brand colors, typography, payment accounts, and delivery zones persist to MySQL and update the public website instantly without code edits.

---

## 2. Shared cPanel Deployment Guide

### Recommended Directory Structure
```text
/home/CPANEL_USER/
├── private_app/             <-- Kept outside public_html for security
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   └── .env
└── public_html/             <-- Public document root
    ├── index.php
    ├── .htaccess
    └── assets/
```

### Step-by-Step Installation

#### Step 1: Database Setup
1. Log in to your cPanel dashboard.
2. Open **MySQL® Databases**.
3. Create a new database (e.g., `CPANEL_USER_threadcraft`).
4. Create a database user with a strong password and assign **All Privileges** to the database.

#### Step 2: Import SQL Migrations
1. Open **phpMyAdmin** from cPanel.
2. Select your newly created database.
3. Click the **Import** tab.
4. Choose `database/migrations/001_initial_schema.sql` and click **Go**.

#### Step 3: Upload Application Files
1. In cPanel **File Manager**, create a folder named `private_app` above `public_html`.
2. Upload the private application folders (`app/`, `config/`, `database/`, `routes/`, `storage/`) to `private_app/`.
3. Upload `public/index.php`, `public/.htaccess`, and `public/assets/` into your `public_html/` folder.

#### Step 4: Configure Environment Credentials
1. In `private_app/`, copy `.env.example` to `.env`.
2. Update the database variables:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=CPANEL_USER_threadcraft
   DB_USERNAME=CPANEL_USER_dbuser
   DB_PASSWORD=YOUR_STRONG_PASSWORD
   APP_ENV=production
   APP_DEBUG=false
   ```
3. Set file permissions on `storage/` to `755`.

#### Step 5: Verify Front Controller & HTTPS
1. Ensure your domain has an active SSL certificate (AutoSSL or Let's Encrypt).
2. Visit your domain in the browser: `https://yourdomain.com`.

---

## 3. Manual Payment Verification Workflow

1. **Checkout**:
   - The customer selects bKash, Nagad, or Rocket.
   - The system displays the admin-configured recipient number (e.g., Merchant `01712-345678`) and step-by-step instructions.
   - The customer sends the funds from their mobile app, copies the **TrxID**, and submits it.
2. **Queueing**:
   - The order is created with payment status `awaiting_verification` and order status `pending`.
3. **Admin Verification**:
   - The admin opens the **Admin Center** -> **Verify Payments**.
   - The admin cross-checks the TrxID with their bKash/Nagad statement.
   - If verified: Admin clicks **Approve**, enters an optional note, and the order advances to `processing`.
   - If invalid: Admin clicks **Reject**, provides a mandatory reason (e.g. "TrxID not found"), which is recorded in the customer's portal and audit log.

---

## 4. Manual QA Verification Checklist

- [x] **Variant Image Galleries**: Switching between "Washed Charcoal" and "Vintage Bone Cream" updates the primary image and thumbnail gallery.
- [x] **Per-Variant Stock**: Selecting an out-of-stock variant disables the "Add to Cart" button and shows a clear stock notice.
- [x] **Guest Gate**: Attempting to checkout without an account triggers the authentication modal.
- [x] **Delivery Zone Recalculation**: Changing the destination from "Dhanmondi" (Dhaka ৳60) to "Chittagong" (Outside Dhaka ৳130) updates the authoritative fee and order snapshot.
- [x] **Coupon Engine**: Code `WELCOME10` computes 10% off; code `HEAVY50` deducts ৳50. Invalid or expired codes are safely rejected.
- [x] **Loyalty Ledger**: Earning points on delivered orders and redeeming points at checkout transactionally updates the customer's balance and audit history.
- [x] **Manual Mobile Payment**: Entering a bKash TrxID queues the claim; admin approval in the dashboard updates order status to `verified`.
- [x] **Live Theme Customizer**: Updating the store tagline or announcement bar in the Admin Center immediately updates the public storefront without a reload or code rebuild.

---

## 5. Database Backup and Restore

### Backup via cPanel:
1. Open **phpMyAdmin**.
2. Select your database.
3. Click **Export** -> Format: **SQL** -> Click **Export**.

### Backup via SSH:
```bash
mysqldump -u DB_USERNAME -p DB_DATABASE > backup_$(date +%Y%m%d).sql
```

### Restore:
```bash
mysql -u DB_USERNAME -p DB_DATABASE < backup_20261020.sql
```

---

## 6. Host Requirements & Limits
- **PHP**: 8.1, 8.2, or 8.3 with `pdo_mysql`, `mbstring`, `openssl`, `json`.
- **Database**: MySQL 8.0+ or MariaDB 10.4+.
- **Web Server**: Apache 2.4+ with `mod_rewrite` enabled.
- **Node.js**: NOT required for production cPanel hosting.
