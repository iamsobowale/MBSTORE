import { api } from "../../lib/api";

export interface CartItem {
  productVariantId: string;
  productId: string;
  productName: string;
  slug: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string | null;
  available: boolean;
  availableQuantity: number;
  issue: string | null;
}

export interface Cart {
  token: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  currency: string;
}

export async function getCart(token: string | null): Promise<Cart> {
  const { data } = await api.get<Cart>("/cart", { params: token ? { token } : {} });
  return data;
}

export async function addToCart(token: string | null, productVariantId: string, quantity: number): Promise<Cart> {
  const { data } = await api.post<Cart>("/cart/items", { productVariantId, quantity }, { params: token ? { token } : {} });
  return data;
}

export async function updateCartItem(token: string, variantId: string, quantity: number): Promise<Cart> {
  const { data } = await api.put<Cart>(`/cart/items/${variantId}`, { quantity }, { params: { token } });
  return data;
}

export async function removeCartItem(token: string, variantId: string): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/cart/items/${variantId}`, { params: { token } });
  return data;
}
