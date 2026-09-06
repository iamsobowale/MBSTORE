# Running MBSITE Locally

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Postgres)
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

---

## Start the stack

Open **three terminal tabs** from the repo root (`/Users/adebayo/Desktop/MBSITE`).

### Tab 1 — Database

```bash
cd /Users/adebayo/Desktop/MBSITE
docker compose up -d db
```

Postgres 16 starts on **localhost:5433**. Healthy in ~5 seconds.

To reset the database completely:

```bash
docker compose down -v   # drops the volume
docker compose up -d db  # fresh Postgres
```

### Tab 2 — API

```bash
cd /Users/adebayo/Desktop/MBSITE/backend
dotnet run --project src/MBSite.Api
```

- Runs on **http://localhost:5159**
- On first run: applies all EF Core migrations and seeds the catalog, admin account, and discount codes automatically
- Swagger UI: **http://localhost:5159/scalar/v1**

### Tab 3 — Frontend

```bash
cd /Users/adebayo/Desktop/MBSITE/frontend
npm run dev
```

- Storefront + admin at **http://localhost:5173**

---

## Dev credentials & test data

| What | Value |
|------|-------|
| Admin login | `admin@mb.local` / `Admin123!` |
| Discount — 10% off | `WELCOME10` |
| Discount — ₦5,000 off (min ₦40k) | `SAVE5000` |
| Payment provider | **Fake** (no API keys needed) |
| Postgres host | `localhost:5433` |

---

## End-to-end walkthrough

### 1. Browse & add to cart

1. Open `http://localhost:5173`
2. Click **Shop** → pick a product → select color + size → **Add to Cart**
3. Cart count in the nav increments

### 2. Checkout

1. Go to `/cart` → **Checkout**
2. Fill the guest form — use email `ada@test.com` (you'll need it to track later)
3. Enter discount code `WELCOME10` → see 10% deducted from the total
4. Submit the form

### 3. Payment (Fake gateway)

1. You're redirected to `/payment/mock`
2. Click **Simulate Successful Payment**
3. You land on the Order Confirmation page with your reference (e.g. `MB-00001`)

**Watch the API terminal** — within 15 seconds you'll see:

```
EMAIL → ada@test.com | Order Confirmed — Your MB order is on its way!
```

This is the background notification dispatcher firing.

### 4. Track your order

1. Go to `http://localhost:5173/track`
2. Enter your reference (`MB-00001`) and email (`ada@test.com`)
3. See the progress timeline and order items

### 5. Admin — manage the order

1. Go to `http://localhost:5173/admin/login`
2. Login: `admin@mb.local` / `Admin123!`

**Dashboard** → see revenue, order counts, low-stock warnings, 30-day bar chart

**Orders** → find your order → click in:
- Click **Processing** → confirm
- Click **Shipped** → confirm
- Each transition fires a customer email (watch the API terminal)

**Customers** → `ada@test.com` is listed with TotalOrders=1, TotalSpent

**Discounts** → `WELCOME10` shows UsageCount=1

---

## Verify security features

### Rate limiting

```bash
# Hit login 11 times — 11th should return 429
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:5159/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"wrong"}'
done
```

Expected: 10 × `401`, 1 × `429`

### Security headers

```bash
curl -I http://localhost:5159/api/v1/products
```

Expected headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`

---

## Run backend tests

```bash
cd /Users/adebayo/Desktop/MBSITE/backend
dotnet test MBSite.slnx
# → 30 passed, 0 failed
```

---

## Switch to real Paystack (test keys)

1. In `backend/src/MBSite.Api/appsettings.Development.json` set:
   ```json
   "Payments": {
     "Provider": "Paystack",
     "Paystack": {
       "SecretKey": "sk_test_...",
       "PublicKey":  "pk_test_..."
     }
   }
   ```
2. Point a Paystack webhook (via Paystack dashboard → Settings → Webhooks) to:
   `POST http://<your-ngrok-url>/api/v1/payments/webhook/Paystack`
3. Restart the API

---

## Deploy with Docker (production)

```bash
cd /Users/adebayo/Desktop/MBSITE
cp .env.example .env
# Edit .env — fill in JWT_KEY, POSTGRES_PASSWORD, PAYSTACK keys, FRONTEND_URL, etc.

docker compose up --build -d
```

Services:
- **db** — Postgres 16 (internal only)
- **api** — .NET API on port 8080
- **frontend** — nginx on port 80, proxies `/api/*` to the API, serves SPA fallback

The API auto-migrates and seeds on first start.
