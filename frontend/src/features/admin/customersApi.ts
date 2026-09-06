import { api } from "../../lib/api";
import type { PagedResult } from "../catalog/api";

export interface AdminCustomerListItem {
  id: string;
  email: string;
  fullName: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export interface AdminCustomerOrderRow {
  orderId: string;
  publicReference: string;
  status: string;
  grandTotal: number;
  currency: string;
  createdAt: string;
}

export interface AdminCustomerDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
  recentOrders: AdminCustomerOrderRow[];
}

export async function listAdminCustomers(params: { page?: number; pageSize?: number; search?: string }): Promise<PagedResult<AdminCustomerListItem>> {
  const { data } = await api.get<PagedResult<AdminCustomerListItem>>("/admin/customers", { params });
  return data;
}

export async function getAdminCustomer(id: string): Promise<AdminCustomerDetail> {
  const { data } = await api.get<AdminCustomerDetail>(`/admin/customers/${id}`);
  return data;
}
