# Roadmap & Build Order

A pragmatic sequence so each phase produces something demoable. Backend (BE) and
frontend (FE) tracks can run in parallel once the API contracts for a slice exist.

## Phase 0 — Foundations ✅ DONE
- BE: solution structure, EF Core + DB, logging, error handling, auth scaffolding
- FE: Vite app, routing, API client, theming (CSS variables from store config)
- Shared: agree API contracts & DTO shapes (`/docs` + OpenAPI)
- Delivered: `docker compose up -d db` (Postgres :5433), StoreSettings slice.

## Phase 1 — Catalog (read path) ✅ DONE
- BE: products/categories/variants/images entities; public list/detail/search/filter/sort
- FE: shop listing (filters/sort/pagination), product detail (variant selection),
  homepage hero; theming live end-to-end
- ✅ Milestone: browse a themed storefront with real products (verified via seeded data)
- Deferred: homepage *configurable sections* rendering (schema exists; wire in Phase 2
  alongside the admin store-config editor). Concurrency-safe stock decrement lands in
  Phase 3/4 via atomic conditional UPDATE.

## Phase 2 — Admin catalog (write path) ✅ DONE
- BE: JWT admin auth (BCrypt, seeded admin), product/variant/category CRUD,
  local-disk image upload (validated), protected `/admin/*` controllers
- FE: login + auth context + protected routes, admin shell (active nav + sign out),
  product list (search/archive), product editor (details, categories, image upload,
  variant matrix), category management, store config + theme editor behind auth
- ✅ Milestone: admin can log in, create/edit/archive products, manage categories,
  upload images, and re-brand the store (verified end-to-end)
- Default admin (dev): `admin@mb.local` / `Admin123!` (configurable via Seed:*)

## Phase 3 — Cart & checkout (no payment yet) ✅ DONE
- BE: cart APIs (token-based), server-authoritative checkout revalidation
  (stock/price/discount/shipping), order creation as PendingPayment with snapshots +
  status history, discount validation engine (seeded WELCOME10 / SAVE5000),
  order-by-tracking-token endpoint
- FE: cart context + page, guest checkout form with server-computed summary,
  discount code apply, order confirmation page, live cart count, Add to cart wired
- ✅ Milestone: place a pending order end-to-end (verified)
- Deferred to Phase 4: atomic stock decrement happens on payment confirmation
  (pending orders validate availability but don't hold stock)

## Phase 4 — Payments ✅ DONE
- BE: provider-agnostic `IPaymentProvider`; **Fake** provider (default, no keys) +
  **Paystack** provider (NGN); initiate/verify/webhook; `WebhookEvents` idempotency
  ledger; **atomic stock decrement** on confirmation (conditional UPDATE + atomic
  order-transition claim); order → Paid with status history
- FE: checkout → initiate → redirect to gateway; mock gateway page (Fake); callback
  page verifies (idempotent); failure handling with retry
- ✅ Milestone verified: paid order via redirect AND via webhook; stock decrements
  exactly once; duplicate webhook is a no-op; webhook signature verified (Paystack)
- Design polish pass also landed (Archivo/Inter type, hero, cards, sticky header)

## Phase 5 — Orders, tracking & notifications ✅ DONE
- BE: admin order mgmt (list/search/filter + paging, detail, validated status
  transitions writing history, idempotent no-op on same status); public tracking by
  reference+email (`GET /orders/track`); event-driven email notifications — an
  `IOrderEventPublisher` fans `OrderStatusChanged` to handlers, the notification
  enqueuer queues emails idempotently (unique `EventKey` "{orderId}:{status}"), a
  hosted `NotificationDispatcherService` sends via `IEmailSender` with exponential
  backoff (dev sender logs the email). Wired into checkout (created) + payment (paid).
- FE: admin orders list (search + status filter + paging), order detail (items,
  customer, status timeline, transition buttons from server-provided `nextStatuses`),
  public tracking page with progress timeline
- ✅ Milestone verified: `Paid→Processing` transition wrote history, enqueued + sent
  the customer email, and the order was retrievable via reference+email tracking;
  invalid transitions 400, repeat-status is a no-op. Backend tests: 27 passing.

## Phase 6 — Discounts, customers, dashboard ✅ DONE
- BE: admin discount CRUD (create/update/toggle), customer records (upsert on
  checkout: TotalOrders, TotalSpent, LastOrderAt), dashboard metrics (revenue,
  awaiting-processing count, low-stock variant count, recent orders, 30-day sales
  time series)
- FE: discounts list + inline create/edit form, activate/deactivate toggle;
  customers list + detail with order history; dashboard with 4 metric cards,
  pure-CSS bar chart (no library dependency), recent orders table
- ✅ Milestone verified: admin can manage all promotions, see customer order
  history, and view real-time business metrics on the dashboard.
  Backend tests: 27 passing. Both builds clean.

## Phase 7 — Hardening ✅ DONE
- **Rate limiting**: ASP.NET Core built-in `AddRateLimiter`; 3 named policies —
  `auth` (10 req/min), `webhook` (120/min), `tracking` (30/min) applied to Login,
  Webhook, and Track endpoints via `[EnableRateLimiting]`
- **Security headers**: `SecurityHeadersMiddleware` adds X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, Permissions-Policy; removes Server banner
- **Idempotency/concurrency tests**: 30 tests total — discount usage count, repeat
  status transition no-op, duplicate notification enqueueing
- **Dockerfiles**: `backend/Dockerfile` (multi-stage SDK→aspnet, non-root user),
  `frontend/Dockerfile` (node build → nginx serve) + `frontend/nginx.conf` (SPA
  fallback, API proxy, static asset caching)
- **docker-compose.yml**: added `api` and `frontend` services; all secrets via
  env vars (no hard-coded values in compose for prod)
- **`appsettings.Production.json`**: template with env-var placeholders (no secrets)
- **`.env.example`**: lists all required env vars with instructions
- **SEO**: `<meta name="description">`, Open Graph tags, `<meta name="theme-color">`
  in index.html
- **Frontend lazy loading**: all admin pages use `React.lazy` + `Suspense`;
  each page is its own chunk in the prod build
- ✅ Milestone: 30 tests passing, both builds clean, Docker stack ready

---

## Next iteration (🔜)
- Staff role + permissions; admin audit log
- Stock reservations at checkout start
- Refund/cancel flows through provider; refund notifications
- SMS notification channel
- Second payment provider
- Related products, quick preview, wishlist

## Future (💡)
- WhatsApp notifications
- Multi-currency / internationalization
- Advanced analytics & reporting
- CRM features
- Invoice/receipt PDFs
- Notification template management UI

## Definition of "MVP done"
- [ ] Customer can browse, filter, and view products on a themed storefront
- [ ] Guest can add to cart and check out without an account
- [ ] Payment confirmed via authoritative, idempotent webhook
- [ ] Stock never oversells under concurrency
- [ ] Orders carry snapshots + full status history; nothing hard-deleted
- [ ] Customer receives emails and can track order without an account
- [ ] Admin manages products, variants, orders, customers, discounts
- [ ] Admin configures branding, theme, banners, and homepage sections
- [ ] Security basics in place (auth, RBAC, rate limits, webhook signatures, no PII leaks)
