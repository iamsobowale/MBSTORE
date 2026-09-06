import { api } from "../../lib/api";

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  primaryImageUrl: string | null;
  colors: string[];
  inStock: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  inStock: boolean;
  availableQuantity: number;
}

export interface SizeMeasurement {
  size: string;
  dimension: string;
  value: string;
  unit: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  inStock: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  colors: string[];
  sizes: string[];
  sizeGuide: SizeMeasurement[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type ProductSort = "Newest" | "PriceAsc" | "PriceDesc" | "BestSelling";

export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
}

export async function fetchProducts(
  params: ProductQueryParams,
): Promise<PagedResult<ProductListItem>> {
  const { data } = await api.get<PagedResult<ProductListItem>>("/products", { params });
  return data;
}

export async function fetchProduct(slug: string): Promise<ProductDetail> {
  const { data } = await api.get<ProductDetail>(`/products/${slug}`);
  return data;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}
