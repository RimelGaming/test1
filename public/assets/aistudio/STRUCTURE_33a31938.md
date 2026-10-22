# T-Shirt Website V2 --- Project Structure and Architecture

## 1. Architecture principles

-   Traditional server-rendered PHP website.
-   MySQL/MariaDB is the source of truth for all business data and
    editable site settings.
-   HTML/CSS/vanilla JavaScript on the frontend.
-   PDO prepared statements for database access.
-   Modular separation of routing, controllers, services, data access,
    templates, validation, and security.
-   Compatible with shared cPanel hosting and Apache.
-   No required Node.js server and no payment gateway APIs.
-   Public document root contains only public entry points and public
    assets.

## 2. Recommended directory layout

``` text
tshirt-v2/
├── app/
│   ├── Controllers/
│   │   ├── Storefront/
│   │   ├── Auth/
│   │   ├── Account/
│   │   ├── Checkout/
│   │   └── Admin/
│   ├── Middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── AdminMiddleware.php
│   │   └── CsrfMiddleware.php
│   ├── Models/
│   ├── Repositories/
│   ├── Services/
│   │   ├── CartService.php
│   │   ├── CheckoutService.php
│   │   ├── InventoryService.php
│   │   ├── PaymentVerificationService.php
│   │   ├── DeliveryZoneService.php
│   │   ├── CouponService.php
│   │   ├── LoyaltyService.php
│   │   ├── SeoService.php
│   │   └── SettingsService.php
│   ├── Validation/
│   ├── Helpers/
│   └── Views/
│       ├── layouts/
│       ├── components/
│       ├── storefront/
│       ├── auth/
│       ├── account/
│       ├── checkout/
│       ├── news/
│       └── admin/
├── bootstrap/
│   └── app.php
├── config/
│   ├── app.php
│   └── database.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   ├── web.php
│   └── admin.php
├── public/
│   ├── index.php
│   ├── .htaccess
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
├── storage/
│   ├── uploads/
│   │   ├── products/
│   │   ├── variants/
│   │   ├── news/
│   │   └── branding/
│   ├── logs/
│   ├── cache/
│   └── sessions/
├── tests/
│   ├── Unit/
│   ├── Integration/
│   └── Manual-QA.md
├── .env.example
├── .gitignore
├── README.md
├── STRUCTURE.md
└── RULES.md
```

This is a recommended logical layout. Adjust implementation details if
necessary, but keep private application files and secrets outside the
public document root.

## 3. cPanel deployment layout

Preferred layout when the hosting account allows private directories
above `public_html`:

``` text
/home/CPANEL_USER/
├── private_app/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   └── .env
└── public_html/
    ├── index.php
    ├── .htaccess
    └── assets/
```

Do not use the literal `CPANEL_USER` as a path; replace it with the
hosting account's real home directory. Configure the public entry point
to load the private bootstrap using a verified absolute path. Never
expose `.env`, logs, database dumps, backups, or private source files
over HTTP.

If the host forces the application into `public_html`, deny web access
to private directories and files using correct server configuration.
Prefer moving private data above the public root when possible. Confirm
`.htaccess` support with the host.

## 4. Request flow

1.  Apache receives the HTTP request.
2.  `public/index.php` loads bootstrap/configuration.
3.  Router matches the request to a route.
4.  Middleware enforces session, authentication, authorization, and CSRF
    rules as applicable.
5.  Controller validates the request and calls a business service.
6.  Service performs business rules and uses repositories/models for
    database operations.
7.  View renders escaped server-side data and loads static assets.
8.  Response is returned with appropriate status code and safe error
    handling.

Controllers should not contain large amounts of SQL or duplicate
business rules. Critical rules belong in services and must also be
enforced server-side.

## 5. Logical database domains

Use migrations to create and update tables. Names may be adapted, but
preserve the relationships and constraints.

### Identity and access

-   `users`: customer/admin identity, email/phone, password hash,
    role/status, timestamps.
-   `user_addresses`: saved customer addresses and delivery-area
    reference.
-   `admin_audit_logs`: actor, action, entity type/id, safe before/after
    summary, timestamp.

### Catalog

-   `categories`: name, unique slug, description, status, sort order.
-   `products`: name, unique slug, description, base price, category,
    publication status, SEO fields, timestamps.
-   `product_variants`: product ID, size, color, SKU, optional price
    override, stock, active state.
-   `product_variant_images`: variant ID, stored path, alt text, sort
    order.
-   Optional `product_images` for product-level/common images if needed.

Use a unique constraint that prevents duplicate size/color combinations
for the same product, while allowing a deliberate variant policy if the
business needs it.

### Cart and orders

-   `carts`, `cart_items`: persistent cart, customer, variant, quantity.
-   `orders`: unique order number, customer, address snapshot, zone
    snapshot, delivery fee snapshot, totals, order/payment states,
    timestamps.
-   `order_items`: product/variant references plus immutable name, SKU,
    size, color, unit price, quantity, line discount and line total
    snapshots.
-   `order_status_history`: order ID, previous/new state, note, actor,
    timestamp.
-   `payments`: order ID, method snapshot, amount, status, transaction
    reference, submitted details, verification actor/time/notes.
-   Optional `returns_refunds`: return/refund request and resolution
    records.

### Payments and shipping configuration

-   `payment_methods`: display name, type, recipient identifier/number,
    account type, instructions, enabled state, sort order.
-   `delivery_zones`: name, fee, matching configuration, active state,
    sort order.
-   `delivery_areas`: district/area names or normalized area identifiers
    mapped to zones.

Never store payment gateway credentials because gateway integration is
not part of the requirements.

### Coupons and loyalty

-   `coupons`: code, type, amount, minimum order, dates, limits,
    eligibility and active state.
-   `coupon_redemptions`: coupon, customer, order, discount, timestamp.
-   `loyalty_accounts` or a derived balance.
-   `loyalty_transactions`: customer, order, transaction type, points
    delta, reason, actor, idempotency key, timestamp.
-   Prefer an auditable ledger; if a balance is cached, update it
    transactionally with the ledger.

### Content and settings

-   `site_settings`: key/value or typed setting records, with validation
    and update metadata.
-   `homepage_sections` and `banners`: content, ordering, visibility,
    publication state.
-   `pages`: title, slug, body, status, SEO fields.
-   `news_posts`: title, slug, body, image, publication state/date, SEO
    fields.

### Optional analytics support

Start with accurate queries over orders and order items. Add summary
tables only if necessary, with a documented refresh strategy. Never
fabricate values.

## 6. Key relationships and integrity

-   One product has many variants.
-   One variant has many variant images.
-   One customer has many addresses and orders.
-   One order has many order items and status history entries.
-   One order may have one or more payment claim/attempt records,
    according to the chosen workflow.
-   Coupons have redemption records linked to orders and customers.
-   Loyalty transactions link to the customer and optionally the
    relevant order.
-   Delivery zones map to supported delivery areas.
-   Admin actions are attributable to an authenticated admin.

Use foreign keys, indexes, unique constraints, and suitable delete
policies. Avoid deleting products or users in a way that destroys
historical order records; prefer archive/disable behavior for referenced
entities.

## 7. Transaction boundaries

Use database transactions for: - Order creation and stock
decrement/reservation. - Coupon redemption and usage-limit
enforcement. - Loyalty awards, redemptions, reversals, and balance
updates. - Payment verification state changes where linked records must
remain consistent. - Refund/cancellation effects on stock and loyalty.

Re-read and lock relevant stock rows within the order transaction. Make
repeated callbacks or admin actions idempotent where applicable. Since
there is no gateway API, manual payment verification is performed by
authorized admins, but it still needs duplicate-action protection and an
audit trail.

## 8. Live settings and caching

The storefront reads saved site settings from MySQL through a settings
service. Admin updates must persist and be visible on the next request.
If caching is implemented: - Provide an explicit invalidation mechanism
after each relevant update. - Do not cache private customer/order data
in a public cache. - Do not cache cart totals or inventory in a way that
bypasses server validation. - Provide safe defaults if optional settings
are absent.

## 9. Route groups

### Public

-   `/`
-   `/shop`
-   `/category/{slug}`
-   `/product/{slug}`
-   `/search`
-   `/news`
-   `/news/{slug}`
-   `/page/{slug}`
-   `/register`, `/login`, `/logout`

### Customer (authenticated)

-   `/account`
-   `/account/profile`
-   `/account/addresses`
-   `/account/orders`
-   `/account/orders/{order}`
-   `/cart`
-   `/checkout`
-   `/checkout/submit`
-   `/orders/{order}/payment-claim`

### Admin (authenticated and authorized)

-   `/admin`
-   `/admin/products`
-   `/admin/categories`
-   `/admin/orders`
-   `/admin/payments`
-   `/admin/payment-methods`
-   `/admin/delivery-zones`
-   `/admin/customers`
-   `/admin/coupons`
-   `/admin/loyalty`
-   `/admin/analytics`
-   `/admin/design`
-   `/admin/settings`
-   `/admin/seo`
-   `/admin/news`
-   `/admin/pages`
-   `/admin/audit-logs`

These are suggested route patterns. Use consistent routing and ensure
every state-changing action uses appropriate authorization, HTTP method,
CSRF protection, and validation.

## 10. Frontend behavior

-   Use CSS variables populated from validated saved theme settings.
-   Use vanilla JavaScript for interactive variant selection, gallery
    switching, cart feedback, and small UI behaviors.
-   Treat JavaScript as progressive enhancement, not a security
    boundary.
-   Render server-validated values and revalidate on submit.
-   Include responsive layouts, accessible labels, keyboard focus
    states, clear errors, empty states, loading feedback, and
    confirmation messages.
