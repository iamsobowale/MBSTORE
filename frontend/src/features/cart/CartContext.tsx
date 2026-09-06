import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addToCart as addToCartApi,
  getCart,
  removeCartItem,
  updateCartItem,
  type Cart,
} from "./api";

const TOKEN_KEY = "mb_cart_token";

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearLocal: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const persistToken = (c: Cart) => {
    if (c.token) localStorage.setItem(TOKEN_KEY, c.token);
    setCart(c);
  };

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      setCart(await getCart(token));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    itemCount: cart?.itemCount ?? 0,
    loading,
    addItem: async (variantId, quantity) => {
      const token = localStorage.getItem(TOKEN_KEY);
      persistToken(await addToCartApi(token, variantId, quantity));
    },
    updateItem: async (variantId, quantity) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;
      persistToken(await updateCartItem(token, variantId, quantity));
    },
    removeItem: async (variantId) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;
      persistToken(await removeCartItem(token, variantId));
    },
    clearLocal: () => {
      // Called after a successful order — the server already emptied the cart.
      setCart(null);
    },
    refresh,
  }), [cart, loading, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
