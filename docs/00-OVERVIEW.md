# MBSITE — Premium Sportswear E-Commerce Platform

> Planning & scope documentation. Read this first, then the domain/data-model and the
> per-stack checklists.

## 1. What we are building

A production-quality **MVP** for a premium sportswear / gym-clothing e-commerce
platform. Customers browse and buy activewear; administrators manage the catalog,
inventory, orders, customers, discounts, notifications, and the visual configuration
of the storefront.

This is **not** a basic CRUD app. We care about domain modeling, data integrity,
security, real-world e-commerce edge cases, and a premium user experience.

## 2. Tech stack

| Layer      | Choice                                                              |
| ---------- | ------------------------------------------------------------------ |
| Backend    | **.NET 8** (ASP.NET Core Web API), **modular monolith**            |
| Database   | PostgreSQL (or SQL Server) via **EF Core**                         |
| Frontend   | **React** (Vite + TypeScript), React Router, TanStack Query        |
| Styling    | CSS variables / design tokens driven by store config (theming)     |
| Auth       | JWT (admin) + guest-first checkout for customers                   |
| Payments   | Provider-agnostic abstraction (e.g. Paystack/Flutterwave/Stripe)   |
| Email      | Pluggable notification service, email channel first                |
| Storage    | Object storage for product images (S3-compatible or local for dev) |
| Background | Hosted service / queue for notifications & webhooks                 |

## 3. Guiding principles

- **Backend is the source of truth.** Never trust prices, discounts, stock, or
  shipping sent by the frontend. Recalculate and revalidate at checkout.
- **Inventory lives on the variant**, not the parent product.
- **Orders store snapshots** of product name, variant, price, and discount at
  purchase time. Editing a product later must not change historical orders.
- **Payment webhooks are authoritative**, not the frontend redirect callback.
- **Idempotency everywhere** for webhooks, notifications, and status updates.
- **Event-driven side effects.** Order status changes raise domain/application
  events; notification handlers react — no direct `OrderService -> EmailService` calls.
- **Theming is configuration-driven.** No hardcoded brand colors in components.
- **Modular monolith**, not microservices. Interfaces only where they add value.
- **Do not overengineer.** Simplest architecture that is robust for a real business.

## 4. Domains (modules)

```
Commerce
├── Catalog        (Products, Categories, Variants, Images)
├── Inventory      (per-variant stock, reservations, concurrency)
├── Cart           (cart, items, pricing preview)
├── Orders         (lifecycle, status history, snapshots)
├── Payments       (provider-agnostic, webhooks, idempotency)
├── Customers      (guest + optional accounts, addresses)
├── Notifications  (event-driven, email first, extensible)
├── Promotions     (discounts, usage tracking, validation)
└── StoreConfig    (branding, theme, homepage sections, banners)
```

## 5. Order lifecycle

```
Pending Payment → Paid → Processing → Ready for Dispatch → Shipped → Delivered
Side states: Payment Failed · Cancelled · Refunded · Partially Refunded
```

Every transition is recorded in **OrderStatusHistory** (never delete orders).

## 6. Roles (MVP)

- **Super Admin / Admin** — full access to everything.
- **Staff** (next iteration) — view/manage orders + statuses only; cannot touch
  store config, secrets, or other admins.

## 7. Repo layout (target)

```
/backend        # .NET solution (modular monolith)
/frontend       # React app (storefront + admin)
/docs           # these planning docs
```

## 8. Document index

| File                          | Purpose                                        |
| ----------------------------- | ---------------------------------------------- |
| `00-OVERVIEW.md`              | This file — scope, stack, principles           |
| `01-DATA-MODEL.md`            | Entities, relationships, snapshot rules        |
| `02-BACKEND-CHECKLIST.md`     | .NET build checklist by domain                 |
| `03-FRONTEND-CHECKLIST.md`    | React build checklist (storefront + admin)     |
| `04-EDGE-CASES.md`            | Master edge-case catalog with handling notes   |
| `05-ROADMAP.md`               | Phase-by-phase plan + what's done               |
| `06-STATE.md`                 | **Live status & handoff — read first if new**   |

## 9. Feature classification legend

Throughout the checklists:

- ✅ **MVP** — required for launch
- 🔜 **Next** — recommended for the next iteration
- 💡 **Future** — nice-to-have / later
