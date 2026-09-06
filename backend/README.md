# MBSite Backend (.NET 10)

Modular monolith for the MBSite sportswear e-commerce platform. See `../docs` for
scope, data model, and checklists.

## Structure

```
src/
  MBSite.Domain          # Entities, value objects, domain events (no dependencies)
  MBSite.Application      # Use cases, DTOs, service interfaces, validation
  MBSite.Infrastructure  # EF Core (Postgres), external providers
  MBSite.Api             # ASP.NET Core Web API host (controllers, middleware)
tests/
  MBSite.Tests           # Unit + integration tests (xUnit)
```

Dependency direction: `Api → Infrastructure → Application → Domain`.

## Prerequisites

- .NET 10 SDK
- PostgreSQL. Easiest: `docker compose up -d db` from the repo root — starts
  Postgres 16 on host port **5433** (chosen to avoid clashing with other local
  instances), matching the default connection string.
- `dotnet tool install --global dotnet-ef`

## Configuration

`src/MBSite.Api/appsettings.json` holds dev defaults. **Override secrets locally**
via user-secrets or environment variables — do not commit real secrets:

- `ConnectionStrings:Default` — Postgres connection
- `Jwt:Key` / `Jwt:Issuer` / `Jwt:Audience` — admin auth
- `Cors:AllowedOrigins` — React app origins (default `http://localhost:5173`)

## Run

```bash
docker compose up -d db          # from repo root — Postgres on :5433
# then from backend/
dotnet build MBSite.slnx
dotnet run --project src/MBSite.Api
```

On startup in Development the API applies migrations and seeds a small sample
catalog (6 products with variants/images across Men/Women/Accessories).

Default dev URL is `http://localhost:5159` (see `Properties/launchSettings.json`).

- Health check: `GET /health`
- OpenAPI (dev): `GET /openapi/v1.json`
- Store config (public): `GET /api/v1/store-config`

Migrations are applied automatically in Development on startup.

## Migrations

```bash
dotnet ef migrations add <Name> \
  --project src/MBSite.Infrastructure \
  --startup-project src/MBSite.Api \
  --output-dir Persistence/Migrations

dotnet ef database update \
  --project src/MBSite.Infrastructure \
  --startup-project src/MBSite.Api
```

## Test

```bash
dotnet test MBSite.slnx
```

## What's built

Phase 0 — Foundations:
- ✅ Layered solution + DI wiring
- ✅ EF Core + Postgres, `AppDbContext`, migrations
- ✅ Serilog logging, global exception → ProblemDetails
- ✅ JWT auth + role-based authorization scaffolding
- ✅ CORS, health checks, OpenAPI
- ✅ Vertical slice: **StoreSettings** (theming) — public GET + admin PUT

Phase 1 — Catalog:
- ✅ Product / ProductVariant (per-variant stock) / ProductImage / Category
- ✅ Public read APIs: `GET /products` (search, category/size/price/availability
  filters, sort, pagination), `GET /products/{slug}`, `GET /categories`
- ✅ Per-variant availability in responses; Published-only exposure
- ✅ Dev data seeder

Phase 2 — Admin:
- ✅ JWT auth (`POST /auth/login`), BCrypt password hashing, seeded admin
- ✅ Protected `/api/v1/admin/*`: product CRUD + variant/image sync, category CRUD,
  image upload (`POST /admin/images`, validated, served from `/uploads`)
- ✅ Store-config admin PUT behind auth
- Default dev admin: `admin@mb.local` / `Admin123!` (override via `Seed:AdminEmail`
  / `Seed:AdminPassword`)

Phase 3 — Cart & checkout:
- ✅ Cart APIs, server-authoritative checkout revalidation, pending orders + snapshots
- ✅ Discount validation engine (seeded WELCOME10 / SAVE5000)

Phase 4 — Payments:
- ✅ `IPaymentProvider` (Fake default + Paystack), initiate/verify/webhook
- ✅ `WebhookEvents` idempotency ledger; **atomic stock decrement** on confirmation
- ✅ Order → Paid with status history; signature-verified Paystack webhook

## Next (per `../docs/05-ROADMAP.md` and `../docs/06-STATE.md`)

Phase 5 — Orders, tracking & notifications: admin order management + status
transitions, public tracking page, event-driven idempotent email notifications.

## Note on package warnings

The .NET 10 templates pull some transitive packages (`Microsoft.OpenApi`,
`System.Security.Cryptography.Xml`) that currently emit NU1903 advisories. Pin
patched versions before production; they do not affect local development.
