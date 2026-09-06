import { api } from "../../lib/api";
import type { Category, PagedResult } from "../catalog/api";

/** Product status enum (matches backend ProductStatus). */
export const ProductStatus = { Draft: 0, Published: 1, Archived: 2 } as const;
export type ProductStatusValue = (typeof ProductStatus)[keyof typeof ProductStatus];

export const STATUS_LABEL: Record<number, string> = {
  0: "Draft",
  1: "Published",
  2: "Archived",
};

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  status: number;
  basePrice: number;
  totalStock: number;
  variantCount: number;
  primaryImageUrl: string | null;
}

export interface AdminVariant {
  id: string | null;
  color: string;
  size: string;
  sku: string;
  price: number | null;
  stockQuantity: number;
  isActive: boolean;
}

export interface AdminImage {
  id: string | null;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface AdminSizeMeasurement {
  size: string;
  dimension: string;
  value: string;
  unit: string;
  sortOrder: number;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  status: number;
  categoryIds: string[];
  images: AdminImage[];
  variants: AdminVariant[];
  sizeGuide: AdminSizeMeasurement[];
}

export interface UpsertProductRequest {
  name: string;
  slug: string | null;
  description: string;
  basePrice: number;
  status: number;
  categoryIds: string[];
  images: AdminImage[];
  variants: AdminVariant[];
  sizeGuide?: AdminSizeMeasurement[];
}

export async function listAdminProducts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: number;
}): Promise<PagedResult<AdminProductListItem>> {
  const { data } = await api.get("/admin/products", { params });
  return data;
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail> {
  const { data } = await api.get(`/admin/products/${id}`);
  return data;
}

export async function createAdminProduct(req: UpsertProductRequest): Promise<AdminProductDetail> {
  const { data } = await api.post("/admin/products", req);
  return data;
}

export async function updateAdminProduct(id: string, req: UpsertProductRequest): Promise<AdminProductDetail> {
  const { data } = await api.put(`/admin/products/${id}`, req);
  return data;
}

export async function archiveAdminProduct(id: string): Promise<void> {
  await api.post(`/admin/products/${id}/archive`);
}

// ---- Categories ----

export interface UpsertCategoryRequest {
  name: string;
  slug: string | null;
  parentId: string | null;
  sortOrder: number;
}

export async function listAdminCategories(): Promise<Category[]> {
  const { data } = await api.get("/admin/categories");
  return data;
}

export async function createAdminCategory(req: UpsertCategoryRequest): Promise<Category> {
  const { data } = await api.post("/admin/categories", req);
  return data;
}

export async function updateAdminCategory(id: string, req: UpsertCategoryRequest): Promise<Category> {
  const { data } = await api.put(`/admin/categories/${id}`, req);
  return data;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await api.delete(`/admin/categories/${id}`);
}

// ---- Image upload ----

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ url: string }>("/admin/images", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}
