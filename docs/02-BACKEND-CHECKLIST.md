# Backend Checklist — .NET 8 (Modular Monolith)

Legend: ✅ MVP · 🔜 Next · 💡 Future

## 0. Project setup
- [ ] ✅ Create solution `MBSite.sln` with projects:
  - [ ] `MBSite.Api` (Web API host, controllers/minimal APIs)
  - [ ] `MBSite.Application` (use cases, DTOs, validation, events)
  - [ ] `MBSite.Domain` (entities, value objects, domain events)
  - [ ] `MBSite.Infrastructure` (EF Core, payments, email, storage)
  - [ ] `MBSite.Tests` (unit + integration)
- [ ] ✅ Configure EF Core + PostgreSQL, connection string via config/secrets
- [ ] ✅ Serilog structured logging
- [ ] ✅ Global exception handling → consistent problem-details responses
- [ ] ✅ FluentValidation for request DTOs
- [ ] ✅ Health check endpoint
- [ ] ✅ Swagger/OpenAPI (dev only)
- [ ] ✅ CORS policy for the React app origin
- [ ] 🔜 Docker + docker-compose (api + db) for local dev

## 1. Catalog
- [ ] ✅ Product, Category, Variant, Image entities + migrations
- [ ] ✅ Admin: create/edit/archive product (never hard-delete)
- [ ] ✅ Admin: manage variants (color/size/sku/price/stock) — unique per combo
- [ ] ✅ Admin: manage categories
- [ ] ✅ Admin: image upload → object storage; validate type/size; generate URLs
- [ ] ✅ Public: list products (pagination, filter by category/size/price/availability)
- [ ] ✅ Public: sort (newest, price asc/desc, best selling)
- [ ] ✅ Public: search products
- [ ] ✅ Public: product detail by slug (only Published)
- [ ] ✅ Product returns per-variant availability (in stock / out of stock)
- [ ] 🔜 Related products / "you may also like"

## 2. Inventory
- [ ] ✅ Stock stored per variant with `RowVersion` concurrency token
- [ ] ✅ Availability check helper (variant in stock for qty?)
- [ ] ✅ Atomic decrement on payment confirmation inside a DB transaction
- [ ] ✅ Concurrency handling for "last item, two buyers" (optimistic retry or row lock)
- [ ] ✅ Low-stock threshold flag for admin dashboard
- [ ] 🔜 Short-lived stock **reservations** at checkout start (with expiry release)
- [ ] 💡 Inventory audit log / stock movement history

## 3. Cart
- [ ] ✅ Create/get cart (customer or anonymous token)
- [ ] ✅ Add / update qty / remove items (by variant)
- [ ] ✅ Server computes subtotal + live prices (display only)
- [ ] ✅ Reject adding out-of-stock / inactive / unpublished variants
- [ ] ✅ Estimated delivery/shipping preview (flat or rule-based)
- [ ] ✅ Apply discount code (preview) — revalidated later at checkout
- [ ] 🔜 Cart expiry / cleanup job

## 4. Orders
- [ ] ✅ Order + OrderItem (snapshots) + OrderStatusHistory entities
- [ ] ✅ Checkout: **revalidate** stock, prices, discount, shipping server-side
- [ ] ✅ Create order in `Pending Payment` with `ExpiresAt`
- [ ] ✅ Generate non-sequential `PublicReference` + secure `TrackingToken`
- [ ] ✅ Guest checkout (no account required) — capture contact + address
- [ ] ✅ Status transition service with allowed-transition validation
- [ ] ✅ Every transition writes OrderStatusHistory
- [ ] ✅ Idempotent status updates (no-op + no duplicate events on same status)
- [ ] ✅ Admin: list/search/filter orders (by ref, customer, status) + pagination
- [ ] ✅ Admin: view order detail, payment status, history, customer info
- [ ] ✅ Public tracking: lookup by (reference + email) OR tracking token
- [ ] 🔜 Cancel / refund / partial-refund flows (keep records, no delete)
- [ ] 💡 Invoice/receipt PDF

## 5. Payments (provider-agnostic)
- [ ] ✅ `IPaymentProvider` abstraction (initiate, verify, parse webhook, verify sig)
- [ ] ✅ One concrete provider (e.g. Paystack/Flutterwave/Stripe)
- [ ] ✅ Initiate payment → return checkout URL/reference to frontend
- [ ] ✅ Webhook endpoint with **signature verification**
- [ ] ✅ Idempotent webhook processing via `WebhookEvents` ledger
- [ ] ✅ Webhook is authoritative → confirms payment, decrements stock, → `Paid`
- [ ] ✅ Handle: duplicate webhook, retry, late confirmation, expired order
- [ ] ✅ Frontend callback only *hints*; never the source of truth
- [ ] ✅ Persist raw payloads for audit
- [ ] 🔜 Refund API call-through to provider
- [ ] 💡 Second payment provider to prove the abstraction

## 6. Customers
- [ ] ✅ Guest customer record from checkout (keyed by email)
- [ ] ✅ Optional post-purchase account creation (claim past orders by email)
- [ ] ✅ Normal registration + login
- [ ] ✅ Address book (save/list) for registered customers
- [ ] ✅ Admin: view customer (contact, total orders, total spent, history)
- [ ] 💡 Full CRM features

## 7. Notifications (event-driven)
- [ ] ✅ Domain/application events on order lifecycle changes
- [ ] ✅ `INotificationChannel` abstraction; Email implementation first
- [ ] ✅ Notification handler subscribes to events (decoupled from OrderService)
- [ ] ✅ Idempotent send via unique `EventKey` (event + recipient)
- [ ] ✅ Templates: created, payment confirmed, processing, shipped, delivered, cancelled
- [ ] ✅ Background dispatch + retry with backoff
- [ ] 🔜 SMS channel · 🔜 refund notifications
- [ ] 💡 WhatsApp channel · 💡 template management UI

## 8. Promotions / Discounts
- [ ] ✅ Discount entity (percentage/fixed, min order, max usage, dates, active)
- [ ] ✅ Admin CRUD for discounts
- [ ] ✅ Validation service: expired, usage limit, min order, disabled, exceeds total
- [ ] ✅ **Revalidate at checkout** (never trust cart-time discount)
- [ ] ✅ Atomic usage-count increment + `DiscountUsage` record
- [ ] 🔜 Per-customer usage limits

## 9. Store configuration
- [ ] ✅ StoreSettings singleton (branding + theme colors + logo/favicon)
- [ ] ✅ Public GET config endpoint (for theming the storefront)
- [ ] ✅ Admin update config (validate hex colors, image uploads)
- [ ] ✅ HomepageSections: enable/disable, retitle, reorder, featured content
- [ ] ✅ Banners CRUD (image, title, subtitle, CTA text/url, enabled, order)
- [ ] ✅ Public GET homepage layout (ordered visible sections + content)

## 10. Admin dashboard data
- [ ] ✅ Metrics: total sales, total orders, awaiting processing, revenue
- [ ] ✅ Low-stock products list
- [ ] ✅ Recent orders
- [ ] ✅ Time series: sales over time, orders over time
- [ ] 🔜 Date-range filtering on analytics

## 11. Security & cross-cutting
- [ ] ✅ Admin auth: JWT, secure password hashing (ASP.NET Identity / bcrypt)
- [ ] ✅ Role-based authorization (SuperAdmin/Admin; Staff 🔜)
- [ ] ✅ All admin endpoints protected; customer PII not over-exposed
- [ ] ✅ Input validation on every write endpoint
- [ ] ✅ Rate limiting (auth, webhook, tracking lookup)
- [ ] ✅ Webhook signature verification
- [ ] ✅ Secrets via config/user-secrets/env (never committed)
- [ ] ✅ No sequential public IDs; tracking via token/reference only
- [ ] ✅ Prevent price/inventory/discount manipulation (server authoritative)
- [ ] ✅ Prevent duplicate payment processing (idempotency ledger)
- [ ] 🔜 Audit log for admin actions

## 12. API design
- [ ] ✅ Capability-oriented endpoints (not table-per-endpoint)
- [ ] ✅ Clear request/response DTOs (never expose entities directly)
- [ ] ✅ Pagination + filtering + sorting on large collections
- [ ] ✅ Consistent error contract (problem details)
- [ ] ✅ Versioned base path (`/api/v1`)

## 13. Testing
- [ ] ✅ Unit tests: pricing, discount validation, status transitions, availability
- [ ] ✅ Integration tests: checkout flow, webhook idempotency, concurrency on stock
- [ ] 🔜 Contract tests for payment provider
