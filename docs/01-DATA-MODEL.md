# Data Model

High-level entities for the MVP. IDs are **GUIDs** (avoid exposing sequential IDs
publicly). Money is stored as integer minor units (e.g. kobo/cents) or `decimal(18,2)`
— pick one and be consistent. Timestamps are UTC.

## Core entities

### Users (admin/staff)
- `Id`, `Email`, `PasswordHash`, `Role` (SuperAdmin | Admin | Staff), `IsActive`,
  `CreatedAt`, `LastLoginAt`

### Customers (optional accounts)
- `Id`, `Email`, `FirstName`, `LastName`, `Phone`, `PasswordHash` (nullable —
  guests have none), `IsRegistered`, `CreatedAt`
- A guest checkout may create a lightweight Customer record keyed by email.

### Addresses
- `Id`, `CustomerId` (nullable for pure guests), `FirstName`, `LastName`, `Phone`,
  `Line1`, `State`, `City`, `DeliveryInstructions`, `CreatedAt`

## Catalog

### Products
- `Id`, `Name`, `Slug`, `Description`, `BasePrice`, `Status` (Draft | Published |
  Archived), `CreatedAt`, `UpdatedAt`
- Publish/archive is separate from delete — products are **never hard-deleted** if
  referenced by orders.

### ProductCategories
- `Id`, `Name`, `Slug`, `ParentId` (nullable), `SortOrder`
- Join: `ProductCategoryMap (ProductId, CategoryId)`

### ProductImages
- `Id`, `ProductId`, `Url`, `AltText`, `SortOrder`, `IsPrimary`

### ProductVariants  ← **inventory lives here**
- `Id`, `ProductId`, `Color`, `Size`, `Sku`, `Price` (nullable override of base),
  `StockQuantity`, `IsActive`, `RowVersion` (concurrency token)
- Unique constraint on `(ProductId, Color, Size)`.

## Cart

### Carts
- `Id`, `CustomerId` (nullable), `AnonymousToken` (for guests), `CreatedAt`,
  `UpdatedAt`, `ExpiresAt`

### CartItems
- `Id`, `CartId`, `ProductVariantId`, `Quantity`, `AddedAt`
- Prices are **computed live** from the catalog for display; never stored as truth
  in the cart.

## Orders

### Orders
- `Id`, `PublicReference` (short, non-sequential, e.g. `MB-8F3K2A`),
  `TrackingToken` (secure random, for public tracking), `CustomerId` (nullable),
  `Email`, `Phone`, `ShippingAddress` (snapshot fields), `Status`,
  `Subtotal`, `DiscountTotal`, `ShippingTotal`, `GrandTotal`, `Currency`,
  `DiscountCode` (snapshot), `CreatedAt`, `ExpiresAt` (for pending payment),
  `PlacedAt`, `RowVersion`

### OrderItems  ← **snapshots**
- `Id`, `OrderId`, `ProductId` (ref only), `ProductVariantId` (ref only),
  `ProductNameSnapshot`, `ColorSnapshot`, `SizeSnapshot`, `SkuSnapshot`,
  `UnitPriceSnapshot`, `Quantity`, `LineTotalSnapshot`, `ImageUrlSnapshot`
- These snapshots must **not** change when the product is later edited.

### OrderStatusHistory
- `Id`, `OrderId`, `FromStatus`, `ToStatus`, `Note`, `ChangedByUserId` (nullable
  for system), `CreatedAt`

## Payments

### Payments
- `Id`, `OrderId`, `Provider`, `ProviderReference`, `Status` (Initiated | Succeeded
  | Failed | Refunded | PartiallyRefunded), `Amount`, `Currency`, `RawPayload`,
  `CreatedAt`, `ConfirmedAt`

### WebhookEvents (idempotency ledger)
- `Id`, `Provider`, `ProviderEventId` (unique), `Signature`, `ReceivedAt`,
  `ProcessedAt`, `Status`
- Enforces once-only processing of duplicate/retried webhooks.

## Promotions

### Discounts
- `Id`, `Code` (unique), `Type` (Percentage | FixedAmount), `Value`,
  `MinOrderAmount`, `MaxUsage`, `UsageCount`, `StartsAt`, `ExpiresAt`, `IsActive`

### DiscountUsage
- `Id`, `DiscountId`, `OrderId`, `CustomerEmail`, `AmountApplied`, `UsedAt`
- Enforces per-code usage limits atomically at checkout.

## Notifications

### Notifications
- `Id`, `Channel` (Email | Sms | WhatsApp), `Recipient`, `TemplateKey`,
  `OrderId` (nullable), `EventKey` (idempotency key, unique per event+recipient),
  `Status` (Pending | Sent | Failed), `Attempts`, `CreatedAt`, `SentAt`
- `EventKey` prevents duplicate sends from retries/repeated webhooks.

## Store configuration

### StoreSettings (single row / singleton)
- `Id`, `BrandName`, `LogoUrl`, `FaviconUrl`, `PrimaryColor`, `SecondaryColor`,
  `BackgroundColor`, `TextColor`, `AccentColor`, `UpdatedAt`
- Defaults: Primary `#000`, Background `#FFF`, Text `#000`, Accent `#FFF`.

### HomepageSections
- `Id`, `Key` (Hero | FeaturedCollection | NewArrivals | BestSellers | Categories |
  PromoBanner | BrandStory | Newsletter), `Title`, `IsVisible`, `SortOrder`,
  `ConfigJson` (section-specific settings, e.g. featured product IDs)

### Banners
- `Id`, `Title`, `Subtitle`, `ImageUrl`, `CtaText`, `CtaUrl`, `IsEnabled`,
  `SortOrder`

## Key relationships

```
Product 1───* ProductVariant 1───* CartItem
Product 1───* ProductImage
Product *───* Category
Cart 1───* CartItem
Order 1───* OrderItem
Order 1───* OrderStatusHistory
Order 1───* Payment 1───* WebhookEvent (via provider ref)
Discount 1───* DiscountUsage
Customer 1───* Address / Order (nullable — guests allowed)
```

## Data-integrity rules (must hold)

1. Inventory is decremented **only** inside a transaction with concurrency control
   (`RowVersion` / `SELECT ... FOR UPDATE`) at payment confirmation or reservation.
2. Order totals are computed server-side; frontend values are ignored.
3. Order items are immutable snapshots.
4. Orders and payments are never hard-deleted.
5. `PublicReference` and `TrackingToken` are the only IDs exposed to customers.
