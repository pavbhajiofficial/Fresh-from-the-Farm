'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type CartItem = { productId: number; quantity: number };

type Ctx = {
  items: CartItem[];
  add: (i: CartItem) => void;
  setQty: (id: number, q: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx>({
  items: [],
  add: () => {},
  setQty: () => {},
  remove: () => {},
  clear: () => {},
});

export const useCart = () => useContext(CartCtx);

function sanitizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is CartItem => {
      return (
        item !== null &&
        typeof item === 'object' &&
        typeof (item as CartItem).productId === 'number' &&
        Number.isInteger((item as CartItem).productId) &&
        (item as CartItem).productId > 0 &&
        typeof (item as CartItem).quantity === 'number' &&
        Number.isInteger((item as CartItem).quantity) &&
        (item as CartItem).quantity > 0 &&
        (item as CartItem).quantity <= 10000
      );
    })
    .map((item) => ({
      productId: Math.floor(item.productId),
      quantity: Math.floor(item.quantity),
    }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Safe initial hydration from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart');
      if (stored) {
        setItems(sanitizeCartItems(JSON.parse(stored)));
      }
    } catch {
      // Ignore localStorage read errors (e.g. disabled in privacy mode)
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage only after initial load, avoiding race wiping
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {
      // Handle storage quota exceeded gracefully
    }
  }, [items, isLoaded]);

  // Synchronize across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue) {
        try {
          setItems(sanitizeCartItems(JSON.parse(e.newValue)));
        } catch {
          // ignore parsing error
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const add = (i: CartItem) => {
    const safeQty = Math.max(1, Math.min(10000, Math.floor(i.quantity)));
    const safeId = Math.floor(i.productId);
    if (safeId <= 0 || safeQty <= 0) return;

    setItems((current) => {
      const exists = current.some((x) => x.productId === safeId);
      if (exists) {
        return current.map((x) =>
          x.productId === safeId
            ? { ...x, quantity: Math.min(10000, x.quantity + safeQty) }
            : x
        );
      }
      return [...current, { productId: safeId, quantity: safeQty }];
    });
  };

  const setQty = (id: number, q: number) => {
    const safeId = Math.floor(id);
    const safeQty = Math.floor(q);
    if (safeQty <= 0) {
      remove(safeId);
      return;
    }
    setItems((current) =>
      current.map((x) => (x.productId === safeId ? { ...x, quantity: Math.min(10000, safeQty) } : x))
    );
  };

  const remove = (id: number) => {
    const safeId = Math.floor(id);
    setItems((current) => current.filter((x) => x.productId !== safeId));
  };

  const clear = () => setItems([]);

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear }}>
      {children}
    </CartCtx.Provider>
  );
}
