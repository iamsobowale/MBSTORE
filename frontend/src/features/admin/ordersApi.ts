import { api } from "../../lib/api";
import type { PagedResult } from "../catalog/api";

/** Display labels for backend OrderStatus enum names. */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  PendingPayment: "Pending payment",
  Paid: "Paid",
  Processing: "Processing",
  ReadyForDispatch: "Ready for dispatch",
  Shipped: "Shipped",
  Delivered: "Delivered",
  PaymentFailed: "Payment failed",
  Cancelled: "Cancelled",
  Refunded: "Refunded",
  PartiallyRefunded: "Partially refunded",
};

/** All statuses selectable in the admin list filter. */
export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL);

export interface AdminOrderListItem {
  id: string;
  publicReference: string;
  status: string;
  customerName: string;
  email: string;
  grandTotal: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderItem {
  productName: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AdminOrderStatusEntry {
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  at: string;
}

export interface AdminOrderDetail {
  id: string;
  publicReference: string;
  trackingToken: string;
  status: string;
  nextStatuses: string[];
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  deliveryInstructions: string | null;
  discountCode: string | null;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  placedAt: string | null;
  createdAt: string;
  items: AdminOrderItem[];
  history: AdminOrderStatusEntry[];
}

export interface ListOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function listAdminOrders(params: ListOrdersParams): Promise<PagedResult<AdminOrderListItem>> {
  const { data } = await api.get<PagedResult<AdminOrderListItem>>("/admin/orders", { params });
  return data;
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  const { data } = await api.get<AdminOrderDetail>(`/admin/orders/${id}`);
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: string,
  note?: string,
): Promise<AdminOrderDetail> {
  const { data } = await api.post<AdminOrderDetail>(`/admin/orders/${id}/status`, { status, note: note ?? null });
  return data;
}
