import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StorefrontLayout } from "./components/layout/StorefrontLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { HomePage } from "./pages/storefront/HomePage";
import { ShopPage } from "./pages/storefront/ShopPage";
import { ProductPage } from "./pages/storefront/ProductPage";
import { CartPage } from "./pages/storefront/CartPage";
import { CheckoutPage } from "./pages/storefront/CheckoutPage";
import { OrderConfirmationPage } from "./pages/storefront/OrderConfirmationPage";
import { PaymentCallbackPage } from "./pages/storefront/PaymentCallbackPage";
import { MockPaymentPage } from "./pages/storefront/MockPaymentPage";
import { TrackOrderPage } from "./pages/storefront/TrackOrderPage";
import { Placeholder } from "./pages/Placeholder";
import { LoginPage } from "./pages/admin/LoginPage";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";

// Admin pages lazy-loaded — kept out of the storefront bundle.
const DashboardPage      = lazy(() => import("./pages/admin/DashboardPage").then(m => ({ default: m.DashboardPage })));
const ProductsPage       = lazy(() => import("./pages/admin/ProductsPage").then(m => ({ default: m.ProductsPage })));
const ProductEditPage    = lazy(() => import("./pages/admin/ProductEditPage").then(m => ({ default: m.ProductEditPage })));
const CategoriesPage     = lazy(() => import("./pages/admin/CategoriesPage").then(m => ({ default: m.CategoriesPage })));
const OrdersPage         = lazy(() => import("./pages/admin/OrdersPage").then(m => ({ default: m.OrdersPage })));
const OrderDetailPage    = lazy(() => import("./pages/admin/OrderDetailPage").then(m => ({ default: m.OrderDetailPage })));
const CustomersPage      = lazy(() => import("./pages/admin/CustomersPage").then(m => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() => import("./pages/admin/CustomersPage").then(m => ({ default: m.CustomerDetailPage })));
const DiscountsPage      = lazy(() => import("./pages/admin/DiscountsPage").then(m => ({ default: m.DiscountsPage })));
const StoreConfigPage    = lazy(() => import("./pages/admin/StoreConfigPage").then(m => ({ default: m.StoreConfigPage })));

const L = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ padding: "var(--space-8)", color: "var(--color-muted)" }}>Loading…</div>}>
    {children}
  </Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront (public) */}
        <Route element={<StorefrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order/:token" element={<OrderConfirmationPage />} />
          <Route path="payment/callback" element={<PaymentCallbackPage />} />
          <Route path="track" element={<TrackOrderPage />} />
          <Route path="*" element={<Placeholder title="Not found" note="This page does not exist." />} />
        </Route>

        {/* Standalone gateway simulation (Fake provider, dev only) */}
        <Route path="payment/mock" element={<MockPaymentPage />} />

        {/* Admin login (public) */}
        <Route path="admin/login" element={<LoginPage />} />

        {/* Admin (protected + lazy) */}
        <Route element={<ProtectedRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<L><DashboardPage /></L>} />
            <Route path="products" element={<L><ProductsPage /></L>} />
            <Route path="products/:id" element={<L><ProductEditPage /></L>} />
            <Route path="categories" element={<L><CategoriesPage /></L>} />
            <Route path="orders" element={<L><OrdersPage /></L>} />
            <Route path="orders/:id" element={<L><OrderDetailPage /></L>} />
            <Route path="customers" element={<L><CustomersPage /></L>} />
            <Route path="customers/:id" element={<L><CustomerDetailPage /></L>} />
            <Route path="discounts" element={<L><DiscountsPage /></L>} />
            <Route path="store-config" element={<L><StoreConfigPage /></L>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
