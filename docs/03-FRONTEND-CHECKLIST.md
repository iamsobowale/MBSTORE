# Frontend Checklist — React (Vite + TypeScript)

Legend: ✅ MVP · 🔜 Next · 💡 Future

Two surfaces in one app (or two apps): **Storefront** (public) and **Admin**.
Premium, minimal, fashion-oriented, mobile-first. Default black & white but **all
brand colors come from store config** — no hardcoded colors in components.

## 0. Project setup
- [ ] ✅ Vite + React + TypeScript
- [ ] ✅ React Router (storefront + admin route groups)
- [ ] ✅ TanStack Query for server state; Axios/fetch API client
- [ ] ✅ Typed API client matching backend DTOs
- [ ] ✅ Env config for API base URL
- [ ] ✅ ESLint + Prettier
- [ ] ✅ Error boundary + toast/notification system

## 1. Theming system (critical)
- [ ] ✅ Fetch StoreSettings on load; expose as **CSS variables** on `:root`
  (`--color-primary`, `--color-bg`, `--color-text`, `--color-accent`, etc.)
- [ ] ✅ Design tokens: spacing, typography scale, radii, shadows
- [ ] ✅ All components reference tokens/variables — **zero hardcoded hex**
- [ ] ✅ Inject brand name, logo, favicon dynamically
- [ ] ✅ Sensible fallback theme while config loads
- [ ] 🔜 Light/dark awareness derived from config

## 2. Design system / shared UI
- [ ] ✅ Button, Input, Select, Badge, Modal, Drawer, Skeleton, Spinner
- [ ] ✅ Product card (image, name, price, discount, colors, out-of-stock badge)
- [ ] ✅ Responsive grid, container, section wrapper
- [ ] ✅ Strong typography, generous spacing, subtle transitions
- [ ] ✅ Accessible (focus states, alt text, keyboard nav)

## 3. Storefront — Homepage
- [ ] ✅ Render sections from backend homepage config (order + visibility)
- [ ] ✅ Hero/banner (image, title, subtitle, CTA)
- [ ] ✅ Featured collection
- [ ] ✅ New arrivals
- [ ] ✅ Best sellers
- [ ] ✅ Shop by category
- [ ] ✅ Promotional banner
- [ ] ✅ Brand/story section
- [ ] ✅ Newsletter/social section
- [ ] ✅ Footer
- [ ] ✅ Gracefully skip hidden/empty sections

## 4. Storefront — Shop / listing
- [ ] ✅ Product grid with pagination (or infinite scroll)
- [ ] ✅ Search
- [ ] ✅ Filters: category, size, price range, availability
- [ ] ✅ Sort: newest, price asc/desc, best selling
- [ ] ✅ Out-of-stock indicators on cards
- [ ] ✅ Loading skeletons + empty states
- [ ] 🔜 Quick product preview (modal)

## 5. Storefront — Product detail
- [ ] ✅ Image gallery (multiple images)
- [ ] ✅ Name, description, price, discount display
- [ ] ✅ Color selector + size selector (per-variant availability)
- [ ] ✅ Disable/mark out-of-stock variants (can't select unavailable combo)
- [ ] ✅ Quantity selector bounded by available stock
- [ ] ✅ Add to cart + Buy now
- [ ] ✅ Size guide (modal)
- [ ] ✅ Handle: unpublished/removed product → graceful 404

## 6. Storefront — Cart
- [ ] ✅ Cart drawer/page: items, variant, qty, remove
- [ ] ✅ Subtotal, estimated delivery, discount code input
- [ ] ✅ Show server-validated prices (re-fetch, don't trust local state)
- [ ] ✅ Handle: variant went out of stock / product removed → inline warning
- [ ] ✅ Persist cart (anonymous token / localStorage + server cart)

## 7. Storefront — Checkout
- [ ] ✅ Guest checkout (no forced account)
- [ ] ✅ Form: first/last name, phone, email, address, state, city, instructions
- [ ] ✅ Order summary with server-recalculated totals
- [ ] ✅ Redirect to payment provider; handle return callback
- [ ] ✅ Handle: payment failed, window closed, redirect fails, slow confirmation
- [ ] ✅ Success page (idempotent on refresh; reflects server order status)
- [ ] ✅ Offer optional account creation after purchase
- [ ] ✅ Validation + clear error messaging

## 8. Storefront — Order tracking
- [ ] ✅ Track by (order number + email) OR secure token link
- [ ] ✅ Show: order number, current status, items, delivery status, timeline
- [ ] ✅ No sequential URLs; use reference/token only
- [ ] ✅ Handle: not found / wrong email → generic safe message

## 9. Storefront — Customer account (optional)
- [ ] ✅ Register / login (optional)
- [ ] ✅ Order history
- [ ] ✅ Saved addresses
- [ ] ✅ Profile management
- [ ] 🔜 Wishlist

## 10. Admin — shell & auth
- [ ] ✅ Admin login (JWT), protected routes, role-aware nav
- [ ] ✅ Clean operational layout (sidebar + topbar) — not a generic template look
- [ ] ✅ Logout, session handling, token refresh/expiry

## 11. Admin — Dashboard
- [ ] ✅ Cards: total sales, total orders, awaiting processing, revenue
- [ ] ✅ Low-stock products list
- [ ] ✅ Recent orders
- [ ] ✅ Charts: sales over time, orders over time

## 12. Admin — Products
- [ ] ✅ List/search/filter products + pagination
- [ ] ✅ Create/edit product; publish/archive
- [ ] ✅ Image upload + reorder + primary image (validate type/size)
- [ ] ✅ Variant matrix editor (color × size → sku, price, stock)
- [ ] ✅ Category management
- [ ] ✅ Set price + discount

## 13. Admin — Orders
- [ ] ✅ List/search/filter (ref, customer, status) + pagination
- [ ] ✅ Order detail: items, totals, payment status, customer, address
- [ ] ✅ Update status (allowed transitions only) + view history timeline
- [ ] 🔜 Trigger refund / cancel

## 14. Admin — Customers
- [ ] ✅ List customers; view profile, contact, total orders, total spent, history

## 15. Admin — Discounts
- [ ] ✅ CRUD: percentage/fixed, min order, usage limit, dates, active toggle
- [ ] ✅ Usage stats display

## 16. Admin — Store configuration
- [ ] ✅ Branding: brand name, logo, favicon upload
- [ ] ✅ Theme colors: primary, secondary, background, text, accent (color pickers)
- [ ] ✅ Live preview of theme changes
- [ ] ✅ Banners CRUD (image, title, subtitle, CTA)
- [ ] ✅ Homepage sections: toggle visibility, rename, **reorder**, pick featured
- [ ] ⚠️ Do **not** build a drag-and-drop page builder — structured config only

## 17. Cross-cutting
- [ ] ✅ Mobile-first responsiveness throughout
- [ ] ✅ Loading / empty / error states everywhere
- [ ] ✅ SEO basics (titles, meta, semantic HTML, image alt)
- [ ] ✅ Never trust/compute authoritative totals client-side — always show server values
- [ ] 🔜 Image optimization / lazy loading
- [ ] 💡 Analytics integration
