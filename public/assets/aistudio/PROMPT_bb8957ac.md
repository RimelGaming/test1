# T-Shirt Website V2 --- Master AI Build Prompt

## Role and objective

Act as a senior PHP engineer, database architect, security engineer,
UI/UX designer, and QA engineer. Build a complete, production-oriented
T-shirt e-commerce **website** from a clean start for shared cPanel
hosting.

Do not merely produce a design, prototype, static mockup, or
disconnected admin dashboard. Implement working customer flows, admin
operations, database persistence, validation, error handling, and
setup/deployment documentation.

The required stack is: - PHP compatible with the target cPanel host
(prefer a currently supported PHP 8.x release available on the host). -
MySQL or MariaDB as supported by the host. - PDO with prepared
statements. - HTML5, CSS3, and vanilla JavaScript. - Apache-compatible
routing and `.htaccess` where available. - No React, Node.js server, or
required always-running background process. - No payment gateway APIs.
Online mobile payments are verified manually by an administrator.

The site must be responsive and mobile-first, accessible, maintainable,
and suitable for a real small clothing business.

## Core operating principle

Use one PHP application and one database as the source of truth. Admin
changes must be saved persistently and reflected on the public website
on subsequent requests without editing source code or rebuilding assets.
Do not use browser-only state as the persistence layer for business
data.

## Required features

### 1. Public storefront

Implement: - Homepage with configurable banners, featured
products/collections, and editable content sections. - Product listing,
categories, collections, search, filters, sorting, and pagination. -
Product detail pages with descriptions, price, gallery, size/color
selection, availability, and add-to-cart. - Variant-aware product images
and stock. - Cart with quantity updates and removal. - Checkout for
authenticated customers only. - News listing and article pages. -
Editable informational pages: About, Contact, FAQ, Shipping, Returns,
and other basic content pages. - Clear shipping, payment, and order
confirmation instructions. - Responsive header, footer, navigation,
product cards, forms, empty states, and error states.

Guests may browse but must register or log in before placing an order.

### 2. Product and variant management

An admin can create, edit, publish, unpublish, and archive products;
manage categories; upload product images; and control inventory.

One product may have multiple colors and sizes. Each size-and-color
combination is a distinct variant with: - Unique SKU. - Color and size
values. - Stock quantity and active/available status. - Optional
variant-specific price override. - Its own image gallery, supporting
multiple images per variant. - Image order and useful alt text where
appropriate.

When a customer selects a color, show that variant's gallery. When they
select a size, update availability, SKU/variant selection, price if
applicable, and stock state. Disable unavailable combinations. Do not
pretend a variant exists if it has not been configured. Validate all
selections and stock on the server.

### 3. Customer accounts

Implement: - Registration, login, logout, password hashing, and password
change. - Customer profile and saved delivery addresses. - Customer
account dashboard. - Order history and order detail pages. - Order
tracking timeline. - Payment claim submission and payment status. -
Loyalty balance and transaction history.

Checkout must require an authenticated customer. Enforce authorization
on every customer-specific route so users cannot access another
customer's orders or addresses.

### 4. Cart, checkout, and orders

-   Validate prices, variant status, quantities, stock, coupons,
    delivery zone, and fees on the server.
-   Never trust totals or prices supplied by the browser.
-   Create unique human-readable order numbers that are not used as
    authorization secrets.
-   Preserve order snapshots: product name, SKU, selected color/size,
    item price, quantity, discount, delivery fee, and final total.
-   Existing order snapshots must not change when a product, price,
    variant, or delivery fee is edited later.
-   Use database transactions for order creation and stock changes.
-   Prevent overselling by locking/rechecking stock within the
    transaction.
-   Use explicit, documented order and payment state transitions.
-   Support cancellation and return/refund records with appropriate
    stock and loyalty adjustments.
-   Provide useful order confirmation and account order-detail screens.

### 5. Payment methods --- no gateway APIs

Support: 1. Cash on Delivery (COD). 2. Manual mobile payments such as
bKash, Nagad, Rocket, and other methods added by an admin.

Do not integrate NagorikPay, UddhoktaPay, or any other gateway. Do not
call payment APIs or require gateway credentials.

Admin payment settings must support: - Add/edit/enable/disable payment
methods. - Display name and method type. - Recipient number/account
identifier. - Account type where relevant (for example, personal or
merchant). - Customer-facing instructions and optional reference/help
text. - Display order. - Safe validation and audit logging for changes.

Checkout must display the current enabled method's instructions and
number clearly, including the exact amount the customer should send. The
customer submits the transaction ID and any other configured required
details. Store the claim with the order and method. Never mark a payment
as paid merely because a customer submitted a transaction ID.

An authorized admin must manually inspect and approve or reject the
claim. Record the decision, admin user, timestamp, and reason/notes
where appropriate. Support statuses such as not required, unpaid,
awaiting verification, verified, rejected, and refunded as applicable.
COD must remain unpaid until an authorized admin confirms collection. Do
not expose payment claims belonging to other customers.

### 6. Delivery zones and fees

Admins can add, edit, enable, disable, and order delivery zones. Each
zone has a name, clear matching rule (for example district/area
selection), and fee. The checkout location selection must map
unambiguously to an enabled zone. Do not infer location from IP address.

Admins can configure supported districts/areas and assign them to zones.
Prevent overlapping or ambiguous rules, or define explicit precedence
and explain it in the UI. Recalculate and validate the fee on the server
at checkout.

Store a snapshot of the selected delivery zone/name and fee in each
order. Future delivery-zone changes must not change existing orders. If
a location is not supported, clearly explain that delivery is
unavailable rather than silently applying the wrong fee.

### 7. Order tracking

Provide an admin-managed workflow with sensible states, such as: -
Pending - Confirmed - Processing - Shipped - Delivered - Cancelled -
Failed, Returned, or Refunded where applicable

Define valid transitions and avoid contradictory states. Record
timestamped status history and optional notes. Admin can add carrier
name and tracking number. Customers can see their own order timeline
while logged in. Do not expose order details through sequential IDs or
order number alone.

### 8. Coupons and promotions

Support: - Fixed amount and percentage discounts. - Start/end dates and
active state. - Minimum order amount. - Usage limits globally and per
customer. - Optional eligible products/categories and customer
restrictions. - Redemption records. - Server-side validation,
recalculation, and protection against duplicate redemption. - Clear
handling of coupon use on cancellation/refund.

### 9. Loyalty points

Implement a configurable points system with: - Admin-configured earning
rules and redemption rules. - Customer balance and transaction
history. - Earn, redeem, adjustment, reversal, and (if configured)
expiry transactions. - Idempotent processing so repeated order events
cannot award points twice. - Clear rules for when points become eligible
(prefer a configurable qualifying order status). - Reversal or
adjustment for eligible cancellations and refunds. - Transactional
updates so the ledger and displayed balance remain consistent. - Admin
audit trail for manual point adjustments.

Do not invent an exchange rate or loyalty policy silently; make it
configurable and document defaults.

### 10. Admin panel

Build a secure, separate admin interface with navigation and responsive
layouts. Include: - Dashboard and recent activity. - Products, variants,
variant images, inventory, and categories. - Orders, order items,
payment claims, and status history. - Customers and customer order
history. - Payment methods and instructions. - Delivery zones, areas,
and fees. - Coupons and redemption history. - Loyalty configuration,
balances, and ledger. - Analytics and reports. - Site identity and
general settings. - Theme/design settings. - Homepage section and banner
management. - SEO settings. - News and content pages. - Admin
users/roles if included in the approved scope. - Audit logs for
sensitive or business-critical actions.

All admin forms must save to the database and show success/error
feedback. Admin controls must perform real actions. Do not include dead
buttons, fake metrics, hardcoded product records in production, or
UI-only toggles.

### 11. Website design and live customization

Admins can manage: - Site name and site description. - Logo and
favicon. - Brand colors and CSS design tokens. - Typography choices from
a safe predefined set. - Header and footer content/settings. - Homepage
banners, section visibility/order, featured products and collections. -
Relevant text/content blocks and contact details.

Persist settings in MySQL. Public pages must load the current saved
settings. Changes should appear on subsequent requests without
rebuilding the site. If caching is introduced, invalidate affected cache
entries after changes. Offer preview where practical, and distinguish
draft/preview from published settings if supported.

Do not allow arbitrary admin-provided CSS or scripts by default.
Validate image uploads and safely handle filenames and storage paths.

### 12. SEO

Support: - Site-wide defaults. - Per-product, category, page, and news
metadata. - Editable slugs with uniqueness validation. - Canonical
URLs. - Open Graph/social sharing metadata. - XML sitemap generated from
published, indexable pages. - Appropriate `robots.txt`. - Relevant
structured data where valid. - Noindex controls for private, account,
cart, checkout, and other non-public pages. - Escaped metadata and safe
canonical URL generation.

Do not promise search ranking outcomes.

### 13. News and content management

Admins can create, edit, preview, publish, unpublish, and delete news
posts and informational pages. Support title, unique slug, content,
featured image, publication state/date, and SEO metadata. Scheduling is
optional and must not depend on an unreliable background process; if
cron is used, document setup and fallback behavior.

### 14. Analytics

Create database-backed, clearly defined reports for: - Orders and sales
over time. - Gross sales, discounts, refunds, and net sales using
documented definitions. - Average order value. - Best-selling products
and variants. - Sales by category and date. - Inventory and low-stock
items. - Coupon usage/performance. - Loyalty points issued, redeemed,
and outstanding where calculable.

Do not fabricate data or label sales as profit without cost data.
Respect date ranges and use appropriate database indexes.

## Technical architecture and project organization

Use a modular PHP structure with clear separation between: - Routing and
request handling. - Controllers. - Models/repositories. - Business
services. - Authentication/authorization middleware. - Validation and
helpers. - Views/templates. - Configuration. - Database
migrations/seeders. - Public assets and public entry point. - Private
uploads/storage/logs/cache as appropriate. - Tests and documentation.

Use a lightweight custom MVC structure or a framework only if it is
genuinely compatible with the target shared hosting and can be deployed
reliably. Do not introduce unnecessary dependencies.

Keep secrets outside the public document root where possible. If cPanel
uses `public_html`, expose only the intended public entry point and
public assets there; keep private application files, environment
secrets, logs, and database dumps above the public root whenever the
host allows it. Never commit production credentials.

## Security requirements

-   Use PDO prepared statements for all database input.
-   Hash passwords with PHP's password APIs and verify safely.
-   Use secure session configuration, regenerate session IDs after
    login, and enforce idle/session protections where practical.
-   Enforce authorization server-side on every protected action.
-   Add CSRF tokens to state-changing forms and validate them.
-   Escape output based on HTML/attribute/URL context.
-   Validate request methods, inputs, and upload content.
-   Restrict uploaded file types and sizes; use generated filenames and
    prevent script execution in upload directories.
-   Use HTTPS in production.
-   Rate-limit or throttle login attempts where feasible.
-   Do not reveal stack traces or secrets to public users.
-   Log relevant errors privately.
-   Audit payment verification, refunds, loyalty adjustments, role
    changes, and sensitive settings changes.
-   Do not store card data or payment credentials.
-   Ensure payment claims are not public and customer data is
    access-controlled.
-   Use transactions and idempotency protections for critical
    operations.
-   Provide backup and restore instructions.

## Implementation and quality process

Work in phases, but deliver a coherent runnable project: 1. Inspect the
repository and hosting constraints, if an existing repository is
provided. Preserve a backup/tag of V1 before changing anything. 2.
Establish architecture, configuration, routing, migrations, installation
procedure, shared layout, and error handling. 3. Implement
authentication and authorization. 4. Implement catalog, variants,
galleries, stock, and admin management. 5. Implement cart, checkout,
delivery zones, COD/manual payments, and order processing. 6. Implement
tracking, customer accounts, coupons, and loyalty. 7. Implement site
customization, SEO, news, pages, and analytics. 8. Test workflows and
security, then prepare deployment documentation.

For every phase: - Run syntax checks where available. - Test database
operations against a real local/staging database. - Test success,
validation failure, unauthorized access, and edge cases. - Fix errors
before declaring the phase complete. - Keep setup instructions and
database migrations in sync with the code.

## Required deliverables

Provide: 1. Complete working source code. 2. SQL migrations and safe
initial setup/seed process. 3. `.env.example` or equivalent
configuration template with no real secrets. 4. Secure initial admin
creation process (never hardcode a public default password). 5.
`README.md` with local setup and cPanel deployment instructions. 6.
`STRUCTURE.md` describing the folders and architecture. 7. `RULES.md`
with non-negotiable development/security rules. 8. Tests or a repeatable
manual QA checklist. 9. Database backup/restore instructions. 10. A list
of any genuine limitations or host requirements.

## Acceptance criteria

Do not claim completion until: - The site installs from documented
instructions. - Database connection and migrations work. - Admin login
and permissions work. - Admin product, variant, image, inventory,
payment, delivery, theme, SEO, news, and coupon changes persist and
affect the public site. - Each size/color combination displays the
correct images and stock. - A customer must log in/register before
checkout. - Delivery fee and checkout totals are calculated on the
server. - COD and manual payment claims work without a gateway API. -
Only an authorized admin can verify a payment. - Orders preserve their
original purchase and delivery snapshots. - Stock cannot be oversold by
concurrent checkout. - Customer order access is restricted to the
correct customer. - Loyalty and coupon logic is validated and duplicate
processing is prevented. - Responsive behavior, validation, and security
checks pass. - Deployment and backup/restore steps are documented.

If a detail is genuinely unspecified, choose a conservative,
configurable default and document it. Do not silently omit requested
features. Do not claim a feature is implemented unless its code and
persistence work.
