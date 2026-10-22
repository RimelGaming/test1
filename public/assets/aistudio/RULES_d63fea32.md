# T-Shirt Website V2 --- AI Development Rules

These rules are mandatory for any AI agent or developer working on this
project. If a requested change conflicts with security, data integrity,
or these rules, explain the conflict and implement the safest compatible
solution.

## 1. Product and project rules

1.  Build a real, database-backed e-commerce website, not a static
    mockup.
2.  Use PHP, MySQL/MariaDB, HTML, CSS, and vanilla JavaScript.
3.  Target shared cPanel hosting and Apache-compatible deployment.
4.  Do not require a Node.js server, React runtime, or a continuously
    running background process.
5.  Do not add payment gateway APIs. Manual mobile payment verification
    is the requirement.
6.  Do not silently omit a requested feature or replace it with a fake
    button.
7.  Do not claim something works until its backend, database
    persistence, and user flow have been tested.
8.  Preserve an existing V1 release/repository if one is supplied; make
    a backup or branch before destructive changes.

## 2. Database and persistence

1.  MySQL is the source of truth for products, variants, inventory,
    orders, payments, customers, delivery zones, coupons, loyalty,
    content, and site settings.
2.  Never hardcode production products, orders, analytics, payment
    numbers, delivery fees, or editable branding into templates.
3.  Use migrations or versioned SQL scripts for schema changes.
4.  Use PDO prepared statements for all user-influenced query values.
5.  Use foreign keys, indexes, unique constraints, and appropriate
    column types.
6.  Use integer minor currency units or suitable fixed-precision decimal
    types; never use floating-point types for money.
7.  Use database transactions for multi-step operations that must
    succeed or fail together.
8.  Preserve historical order snapshots. Later edits to a product,
    price, variant, or delivery fee must not rewrite an existing order.
9.  Avoid destructive deletion of records referenced by orders; archive
    or disable them where appropriate.
10. Do not commit real credentials, `.env` files, customer exports,
    database dumps, or production logs to Git.

## 3. Product variant rules

1.  A product can have multiple colors and sizes.
2.  Every configured size/color combination is a distinct variant
    record.
3.  Each variant has its own SKU, stock, active status, and optional
    price override.
4.  Each color/variant can have multiple images; the correct gallery
    must display when the customer selects that variant.
5.  Do not use one shared stock counter for all size/color combinations.
6.  Disable unavailable combinations and validate the selected variant
    on the server.
7.  Cart and order items must preserve the exact selected variant, SKU,
    color, size, price, and product-name snapshot.
8.  Prevent duplicate SKU and duplicate size/color combinations
    according to the defined schema constraints.

## 4. Authentication and authorization

1.  Customers must register or log in before checkout.
2.  Guests may browse but must not place orders.
3.  Hash passwords using PHP password APIs; never store plaintext
    passwords.
4.  Regenerate session IDs after successful authentication.
5.  Enforce authorization on every protected route and every
    state-changing action.
6.  Customers may access only their own profiles, addresses, carts,
    orders, and payment claims.
7.  Admin pages and actions must require an authorized admin session.
8.  Do not rely on hiding links or buttons as access control.
9.  Use safe password reset/change flows if implemented; never reveal
    whether a secret credential is correct.

## 5. Payments: manual verification only

1.  Support Cash on Delivery and admin-configured manual mobile payment
    methods.
2.  Admin can manage method names, numbers/account identifiers, account
    types, instructions, enabled state, and display order.
3.  Checkout must show clear instructions and the amount to pay.
4.  Customers submit transaction references/details; submission does not
    equal payment confirmation.
5.  Only an authorized admin can approve or reject a manual payment
    claim.
6.  Record who verified/rejected the claim, when, and any relevant
    notes.
7.  COD remains unpaid until collection is confirmed by an authorized
    admin.
8.  Do not call NagorikPay, UddhoktaPay, bKash, Nagad, Rocket, or other
    payment APIs.
9.  Do not add gateway SDKs, gateway credentials, webhook endpoints, or
    fake automated verification.
10. Protect payment claims and transaction references from public access
    and other customers.
11. Make repeated verification actions safe and auditable.

## 6. Delivery and checkout rules

1.  Admin-configured delivery zones and fees determine checkout delivery
    charges.
2.  Each supported area must map clearly to an enabled zone.
3.  Validate the selected area and fee on the server; never trust a
    browser-submitted fee.
4.  If an area is unsupported or ambiguous, show an explicit error and
    do not guess.
5.  Save the selected zone and delivery-fee snapshot on the order.
6.  Recalculate product prices, discounts, shipping, and total on the
    server immediately before order creation.
7.  Use transactions and stock locks/rechecks to prevent overselling.
8.  Never create duplicate orders from accidental double submissions.
9.  Use unique order numbers, but never treat an order number as an
    authentication secret.

## 7. Coupons, loyalty, and analytics

1.  Validate coupons server-side for date, eligibility, limits, minimum
    amount, and prior usage.
2.  Enforce coupon limits safely under concurrent requests.
3.  Record redemptions and make duplicate redemption impossible.
4.  Make loyalty transactions auditable; do not only overwrite the
    balance.
5.  Award points only at the configured qualifying event and prevent
    duplicate awards.
6.  Define and document point reversal/adjustment behavior for
    cancellations and refunds.
7.  Keep loyalty ledger and balance consistent transactionally.
8.  Do not fabricate analytics or use sample numbers in production
    dashboards.
9.  Document metric definitions; do not call revenue "profit" without
    reliable cost data.

## 8. Security rules

1.  Use CSRF tokens on state-changing forms and validate them
    server-side.
2.  Escape output for its context to prevent XSS.
3.  Validate and normalize inputs on the server.
4.  Use prepared statements to prevent SQL injection.
5.  Configure secure session cookies and HTTPS in production.
6.  Restrict upload types and sizes; verify file contents where
    feasible.
7.  Generate upload filenames and prevent uploaded files from being
    executed as scripts.
8.  Keep secrets, logs, backups, and private source files outside the
    public document root whenever possible.
9.  Do not expose stack traces, SQL errors, credentials, filesystem
    paths, or private data to visitors.
10. Log errors privately and provide safe user-facing messages.
11. Apply login throttling/rate limiting where feasible.
12. Audit payment verification, refunds, loyalty adjustments, role
    changes, and sensitive settings updates.
13. Never store card details or unnecessary sensitive payment data.
14. Use least privilege for database accounts and admin permissions.

## 9. Admin and live website rules

1.  Every admin control must perform a real operation and show a clear
    result.
2.  All editable settings must persist in the database.
3.  Site name, description, logo, favicon, theme, header/footer,
    homepage content, SEO, payment methods, delivery zones, and news
    must update the public site without code edits or a rebuild.
4.  If caching is used, invalidate affected cache entries after changes.
5.  Provide sensible defaults for missing optional settings.
6.  Do not allow arbitrary CSS/JavaScript injection by default.
7.  Use draft/preview/publish states where practical for design/content
    changes.
8.  Record important admin actions in audit logs.

## 10. Code quality

1.  Keep routing, controllers, business services, repositories/models,
    validation, and views separated.
2.  Avoid giant all-in-one PHP files and duplicated business rules.
3.  Use consistent naming, formatting, error handling, and route
    conventions.
4.  Keep dependencies minimal and compatible with shared hosting.
5.  Do not introduce a framework or dependency without explaining why it
    is needed and how it deploys on cPanel.
6.  Do not use browser local storage as the authoritative store for
    orders, inventory, payment status, loyalty, or admin settings.
7.  JavaScript may improve the interface but cannot replace server-side
    validation.
8.  Keep documentation aligned with actual implementation.

## 11. Testing and completion

Before declaring a feature complete: 1. Run PHP syntax checks where
available. 2. Test database migrations and fresh installation. 3. Test
success and failure cases. 4. Test unauthorized access and
cross-customer access. 5. Test invalid input, duplicate submissions,
unavailable stock, and stale prices. 6. Test product variant galleries
and per-variant inventory. 7. Test manual payment submission and admin
verification without any gateway API. 8. Test delivery-zone mapping and
server-calculated fees. 9. Test coupon limits and loyalty idempotency.
10. Test admin settings persistence and storefront updates. 11. Test
responsive layouts and form errors on mobile. 12. Document any test that
could not be run and why; do not claim it passed. 13. Verify cPanel
deployment instructions, permissions, HTTPS assumptions, and
backup/restore procedures.

## 12. AI workflow rules

1.  Read `PROMPT.md`, `STRUCTURE.md`, and `RULES.md` before
    implementation.
2.  Inspect the repository and current hosting constraints before
    changing files.
3.  Present a brief implementation plan and identify assumptions.
4.  Build in small, testable phases; do not dump an unverified codebase
    in one pass.
5.  After each phase, summarize changed files, database changes, tests
    run, results, and remaining work.
6.  If a requirement is ambiguous, choose a conservative configurable
    default and document it instead of silently omitting the feature.
7.  Never fabricate test results, deployment status, integrations, or
    implemented features.
8.  Do not leave placeholder functions, dead buttons, TODO-only core
    features, or mock data in production paths.
9.  If the environment cannot run a required test, provide exact steps
    for the user to run it.
10. Update this documentation when architecture or behavior changes.
