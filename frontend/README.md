# MBSite Frontend (React + Vite + TypeScript)

Storefront + admin for the MBSite sportswear platform. See `../docs` for scope and
checklists.

## Structure

```
src/
  lib/            # api client (axios), react-query client
  features/       # feature modules (api + types), e.g. storeConfig
  theme/          # ThemeProvider — applies store config as CSS variables
  styles/         # theme.css — design tokens (brand colors are defaults only)
  components/     # shared UI + layouts (StorefrontLayout, AdminLayout)
  pages/          # storefront/* and admin/* route pages
  App.tsx         # routes (storefront + admin groups)
  main.tsx        # providers (ErrorBoundary, QueryClient, ThemeProvider)
```

## Theming (important)

Brand colors are **never hardcoded** in components. `theme.css` defines default
tokens (premium black & white); `ThemeProvider` fetches `StoreSettings` from the
backend and overrides the CSS variables (`--color-primary`, `--color-bg`, etc.) on
`:root` at runtime. Admins change branding at `/admin/store-config`.

## Setup

```bash
cp .env.example .env   # set VITE_API_BASE_URL to your backend
npm install
npm run dev            # http://localhost:5173
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run preview` — preview the production build
- `npm run lint` — lint

## Routes

Storefront: `/`, `/shop`, `/product/:slug`, `/cart`, `/checkout`, `/track`
Admin: `/admin`, `/admin/products`, `/admin/orders`, `/admin/customers`,
`/admin/discounts`, `/admin/store-config`

## What's scaffolded (Phase 0)

- ✅ Vite + React + TS, routing (storefront + admin groups)
- ✅ TanStack Query + typed axios client (JWT-aware)
- ✅ Config-driven theming (CSS variables from StoreSettings)
- ✅ Error boundary, layouts, premium homepage hero
- ✅ Working admin **Store Config** editor (theme round-trip to backend)

Most feature pages are placeholders until their backend phase lands
(`../docs/05-ROADMAP.md`).
