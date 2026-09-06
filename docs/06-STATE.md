# Project State & Handoff

> Living status doc. Read this first if you're picking the project up fresh.
> Last updated after **Phase 7 (Hardening — rate limiting, security headers, Docker, SEO, lazy loading)**.

## Where we are

Phases 0–5 are **done and verified end-to-end** (see `05-ROADMAP.md` for detail):

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Foundations (solution, EF, auth scaffolding, theming) | ✅ |
| 1 | Catalog read path (products/categories/variants, storefront) | ✅ |
| 2 | Admin catalog write path (auth, product/category CRUD, image upload) | ✅ |
| 3 | Cart & checkout (server-authoritative, discounts, pending orders) | ✅ |
| 4 | Payments (Fake + Paystack providers, idempotent webhook, stock decrement) | ✅ |
| 5 | Orders admin + status transitions, public tracking, event-driven email notifications | ✅ |
| 6 | Discounts admin CRUD, Customer records (upsert on checkout), Dashboard metrics | ✅ |
| 7 | Rate limiting, security headers, concurrency tests, Docker, SEO, lazy loading | ✅ |
| — | Size guide feature (per-size measurements, admin-editable) | ✅ |
| — | Design polish (Archivo/Inter type system, hero, cards) | ✅ |

**Backend tests: 30 passing.** Backend + frontend both build clean. Docker stack ready.

## Next up

Phases 0–7 are complete. The app is MVP-ready for deployment. Remaining optional
improvements (from `05-ROADMAP.md`):

- Staff roles + admin audit log
- Stock reservations at checkout start (hold stock for N minutes)
- Refund/cancel flows through provider
- SMS notifications
- Related products, wishlist

## Run it

```bash
# from repo root
docker compose up -d db                     # Postgres 16 on host :5433
dotnet run --project backend/src/MBSite.Api # API on http://localhost:5159
cd frontend && npm run dev                  # storefront/admin on http://localhost:5173
```

- API auto-applies migrations and seeds on startup in Development.
- Fresh reseed: `docker compose down -v && docker compose up -d db`, then restart API.

## Credentials & test data (dev seed)

- **Admin:** `admin@mb.local` / `Admin123!` (login at `/admin/login`)
- **Discount codes:** `WELCOME10` (10%), `SAVE5000` (₦5,000 off orders ≥ ₦40,000)
- **Payments:** provider defaults to **Fake** — checkout redirects to `/payment/mock`
  where you click "Simulate successful/failed payment". No API keys needed.
- Seeded catalog: 6 products (Men/Women/Accessories) with variants, Unsplash images,
  and size guides on the apparel items.

## Build / test / migrate

```bash
# backend (from backend/)
dotnet build MBSite.slnx
dotnet test MBSite.slnx
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet ef migrations add <Name> --project src/MBSite.Infrastructure --startup-project src/MBSite.Api --output-dir Persistence/Migrations

# frontend (from frontend/)
npm run build   # tsc + vite (this is the typecheck gate)
```

## Architecture map (where things live)

Backend (`backend/src`, modular monolith, layered: Api → Infrastructure → Application → Domain):
- `MBSite.Domain/<Area>` — entities (Catalog, Cart, Orders, Payments, Promotions, Identity, StoreConfiguration)
- `MBSite.Application/<Area>` — services + DTOs + interfaces (e.g. `Checkout/CheckoutService`, `Payments/PaymentService`)
- `MBSite.Infrastructure` — `Persistence` (AppDbContext, Configurations, Migrations, DataSeeder), `Security` (JWT, BCrypt), `Storage` (LocalFileStorage → swap for Cloudinary later), `Payments` (Fake/Paystack providers)
- `MBSite.Api/Controllers` — thin controllers; `Middleware/ExceptionHandlingMiddleware` maps AppExceptions → status codes

Frontend (`frontend/src`):
- `features/<area>/api.ts` — typed API clients (catalog, cart, checkout, auth, admin, storeConfig)
- `features/auth/AuthContext`, `features/cart/CartContext` — providers (also in `main.tsx`)
- `theme/ThemeProvider` — applies StoreSettings as CSS variables (theming)
- `styles/theme.css` — design tokens + global styles + `.mb-btn` / `.mb-card` / `.eyebrow`
- `pages/storefront/*`, `pages/admin/*`, `components/*`

## Key contracts (public API)

- `GET /api/v1/products` (filters/sort/paging), `GET /products/{slug}`, `GET /categories`
- `GET/PUT /store-config`
- `POST /auth/login`
- `POST /cart/items`, `PUT/DELETE /cart/items/{variantId}`, `GET /cart?token=`
- `POST /checkout`, `GET /orders/{trackingToken}`, `POST /discounts/validate`
- `GET /orders/track?reference=&email=` — public tracking (literal route beats `{trackingToken}`)
- `POST /payments/initiate`, `POST /payments/verify`, `POST /payments/webhook/{provider}`
- Admin (JWT, roles SuperAdmin/Admin): `/admin/products`, `/admin/categories`, `/admin/images`
- Admin orders: `GET /admin/orders` (search/status/paging), `GET /admin/orders/{id}`,
  `POST /admin/orders/{id}/status` (body `{status, note?}`; validated + idempotent)

## Gotchas / decisions worth knowing

1. **Client-generated GUID keys** (`BaseEntity.Id = Guid.NewGuid()`): when adding a
   *child* to an already-tracked parent during an update, EF marks it **Modified**
   (→ "0 rows affected"). Fix used throughout: add new children via the `DbSet`
   (`_db.X.Add(...)`) so they're marked Added. Bit us in product update, cart add.
2. **Npgsql 10 removed `UseXminAsConcurrencyToken`.** We don't use an optimistic
   token. Overselling is prevented by the **atomic conditional UPDATE** in
   `PaymentService.ConfirmAsync` (`WHERE StockQuantity >= qty`) plus an atomic
   order-transition claim (`WHERE Status = PendingPayment`).
3. **Stock is decremented at payment confirmation**, not at checkout. Pending orders
   only validate availability. This matches the "webhook is authoritative" rule.
4. **`ExecuteUpdateAsync` isn't supported by EF InMemory** — so `ConfirmAsync` is
   verified via curl against Postgres, not unit-tested with InMemory. Unit tests
   cover provider signature/parse logic and the InMemory-friendly services.
5. **Postgres runs on host port 5433** (5432 was taken on this machine). Connection
   string + compose already set to 5433.
6. **Images:** local disk (`backend/src/MBSite.Api/wwwroot/uploads`, gitignored) via
   `IFileStorage`. Plan: swap to **Cloudinary** later — one new `IFileStorage` impl +
   one DI line; only URLs are stored in the DB.
7. **Money** = `decimal(18,2)`, single currency **NGN**. Paystack uses kobo (×100).
8. **dotnet-ef** installed as a global tool; `export PATH="$PATH:$HOME/.dotnet/tools"`.
9. Package advisories (NU1903) from .NET 10 templates (`Microsoft.OpenApi`,
   `System.Security.Cryptography.Xml`) are warnings; pin before production.
10. **Notifications are event-driven, not inline.** Order/payment/admin code raises
    `OrderStatusChanged` via `IOrderEventPublisher`; the `NotificationEnqueuer` handler
    queues an email row (idempotent, unique `EventKey` = `{orderId}:{status}`), and the
    hosted `NotificationDispatcherService` (Api, every 15s) sends it via `IEmailSender`
    with exponential backoff. Dev `IEmailSender` = **`LoggingEmailSender`** (writes the
    email to the log — no SMTP). Swap that one DI line for real SMTP/provider in prod.
    Handlers never throw into the publisher, so a mail failure can't break a transition.
11. **Only 6 statuses notify the customer** (created, paid, processing, shipped,
    delivered, cancelled) — see `OrderEmailTemplates.Notifiable`. Others transition
    silently. `NotificationDispatcher` retries `Failed` rows up to 5 attempts.

## Switching payments to real Paystack

Set in `appsettings` (or env):
```
Payments:Provider = Paystack
Payments:Paystack:SecretKey = sk_test_...
```
Then point a Paystack webhook at `POST /api/v1/payments/webhook/Paystack`
(signature = HMAC-SHA512 of raw body with the secret, header `x-paystack-signature`).
