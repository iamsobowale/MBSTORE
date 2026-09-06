import { api } from "../../lib/api";

export interface CheckoutRequest {
  cartToken: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine: string;
  state: string;
  city: string;
  deliveryInstructions: string | null;
  discountCode: string | null;
}

export interface OrderItem {
  productName: string;
  color: string;
  size: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusEntry {
  status: string;
  note: string | null;
  at: string;
}

export interface OrderSummary {
  publicReference: string;
  trackingToken: string;
  status: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  state: string;
  city: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  discountCode: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusEntry[];
}

export async function placeOrder(req: CheckoutRequest): Promise<OrderSummary> {
  const { data } = await api.post<OrderSummary>("/checkout", req);
  return data;
}

export async function getOrderByToken(token: string): Promise<OrderSummary> {
  const { data } = await api.get<OrderSummary>(`/orders/${token}`);
  return data;
}

/** Self-service tracking by public reference + email (from the confirmation email). */
export async function trackOrder(reference: string, email: string): Promise<OrderSummary> {
  const { data } = await api.get<OrderSummary>("/orders/track", { params: { reference, email } });
  return data;
}

export interface DiscountPreview {
  valid: boolean;
  error: string | null;
  amount: number;
}

export async function validateDiscount(code: string, subtotal: number): Promise<DiscountPreview> {
  const { data } = await api.post<DiscountPreview>("/discounts/validate", { code, subtotal });
  return data;
}
