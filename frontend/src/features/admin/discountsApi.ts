import { api } from "../../lib/api";
import type { PagedResult } from "../catalog/api";

export const DISCOUNT_TYPE_LABEL: Record<string, string> = {
  Percentage: "Percentage (%)",
  FixedAmount: "Fixed amount (₦)",
};

export interface AdminDiscountListItem {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxUsage: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDiscountDetail extends AdminDiscountListItem {}

export interface UpsertDiscountRequest {
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxUsage: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export async function listAdminDiscounts(params: { page?: number; pageSize?: number; search?: string }): Promise<PagedResult<AdminDiscountListItem>> {
  const { data } = await api.get<PagedResult<AdminDiscountListItem>>("/admin/discounts", { params });
  return data;
}

export async function getAdminDiscount(id: string): Promise<AdminDiscountDetail> {
  const { data } = await api.get<AdminDiscountDetail>(`/admin/discounts/${id}`);
  return data;
}

export async function createAdminDiscount(req: UpsertDiscountRequest): Promise<AdminDiscountDetail> {
  const { data } = await api.post<AdminDiscountDetail>("/admin/discounts", req);
  return data;
}

export async function updateAdminDiscount(id: string, req: UpsertDiscountRequest): Promise<AdminDiscountDetail> {
  const { data } = await api.put<AdminDiscountDetail>(`/admin/discounts/${id}`, req);
  return data;
}

export async function toggleDiscount(id: string, active: boolean): Promise<void> {
  await api.post(`/admin/discounts/${id}/${active ? "activate" : "deactivate"}`);
}
