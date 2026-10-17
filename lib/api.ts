/**
 * DATA LAYER. Every page talks to the database only through these functions.
 * Backend team: replace each body with a fetch() to your endpoints (shapes are in lib/types.ts
 * and db/schema.sql).
 *
 * For frontend-only testing and GitHub deployment, this layer persists state to
 * browser localStorage so changes (added produce, orders, status changes) persist
 * across refreshes and page navigation.
 */
import type { Order, OrderItem, OrderStatus, Product, ProductStatus } from './types';

const INITIAL_BASE = {
  harvestDate: '2026-10-15',
  fulfilment: 'Delivery or pickup',
  farmName: 'Kaveri Acres',
  verified: true,
  status: 'Active' as ProductStatus,
};

const INITIAL_PRODUCTS: Product[] = [
  { ...INITIAL_BASE, id: 1, name: 'Vine Tomatoes', category: 'Vegetables', grade: 'Grade A', description: 'Sun-ripened tomatoes picked at dawn. Firm and deep red.', price: 42, unit: 'kg', stock: 800, minOrder: 20, location: 'Coimbatore', farmerName: 'Meena Devi' },
  { ...INITIAL_BASE, id: 2, name: 'Orange Carrots', category: 'Vegetables', grade: 'Grade A', description: 'Sweet, crunchy hill-grown carrots.', price: 55, unit: 'kg', stock: 420, minOrder: 10, location: 'Ooty', farmerName: 'Rajan K', farmName: 'Hilltop Roots' },
  { ...INITIAL_BASE, id: 3, name: 'Baby Spinach', category: 'Greens', grade: 'Organic', description: 'Tender leaves, grown without synthetic pesticides.', price: 30, unit: 'bunch', stock: 150, minOrder: 5, location: 'Chennai', farmerName: 'Lakshmi S', farmName: 'Green Loop Farm', verified: false },
  { ...INITIAL_BASE, id: 4, name: 'Blueberries', category: 'Fruit', grade: 'Premium', description: 'Plump, sweet cool-climate berries in 500 g punnets.', price: 380, unit: 'kg', stock: 60, minOrder: 2, location: 'Kodaikanal', farmerName: 'Anand P', farmName: 'Mist Valley Berries' },
  { ...INITIAL_BASE, id: 5, name: 'Cherry Tomatoes', category: 'Vegetables', grade: 'Grade A', description: 'Bite-sized and juicy. Next harvest soon.', price: 90, unit: 'kg', stock: 0, minOrder: 5, location: 'Chennai', farmerName: 'Lakshmi S', farmName: 'Green Loop Farm', verified: false, status: 'Sold Out' },
  { ...INITIAL_BASE, id: 6, name: 'Curry Leaves', category: 'Greens', grade: 'Fresh', description: 'Fragrant leaves cut the same morning.', price: 20, unit: 'bunch', stock: 300, minOrder: 10, location: 'Coimbatore', farmerName: 'Meena Devi' },
];

const INITIAL_ORDERS: Order[] = [
  { id: 'FF-1042', buyerName: 'Sri Retail Mart', status: 'Placed', createdAt: '2026-10-16', items: [{ productId: 1, quantity: 100, unitPrice: 42 }] },
  { id: 'FF-1039', buyerName: 'Green Plate Cafe', status: 'Confirmed', createdAt: '2026-10-15', items: [{ productId: 2, quantity: 30, unitPrice: 55 }] },
  { id: 'FF-1031', buyerName: 'Nila Foods', status: 'Completed', createdAt: '2026-10-12', items: [{ productId: 4, quantity: 8, unitPrice: 380 }] },
];

function sanitizeString(str: unknown, maxLen = 300): string {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLen).trim();
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota limits or private browsing
  }
}

let productsCache: Product[] = INITIAL_PRODUCTS;
let ordersCache: Order[] = INITIAL_ORDERS;

function getProducts(): Product[] {
  const stored = loadFromStorage<Product[]>('ff_products', productsCache);
  productsCache = Array.isArray(stored) && stored.length > 0 ? stored : INITIAL_PRODUCTS;
  return productsCache;
}

function getOrders(): Order[] {
  const stored = loadFromStorage<Order[]>('ff_orders', ordersCache);
  ordersCache = Array.isArray(stored) && stored.length > 0 ? stored : INITIAL_ORDERS;
  return ordersCache;
}

export const listProducts = async (): Promise<Product[]> => {
  return [...getProducts()];
};

export const getProduct = async (id: number): Promise<Product | null> => {
  const safeId = Math.floor(id);
  const found = getProducts().find((p) => p.id === safeId);
  return found ? { ...found } : null;
};

export const addProduct = async (p: Omit<Product, 'id'>): Promise<Product> => {
  const current = getProducts();
  const nextId = current.length > 0 ? Math.max(...current.map((item) => item.id)) + 1 : 1;
  const created: Product = {
    ...p,
    id: nextId,
    name: sanitizeString(p.name, 100),
    grade: sanitizeString(p.grade, 50),
    description: sanitizeString(p.description, 1000),
    location: sanitizeString(p.location, 100),
    unit: sanitizeString(p.unit, 20) || 'kg',
    price: Math.max(0, Number(p.price) || 0),
    stock: Math.max(0, Number(p.stock) || 0),
    minOrder: Math.max(1, Number(p.minOrder) || 1),
    harvestDate: sanitizeString(p.harvestDate, 20),
    fulfilment: sanitizeString(p.fulfilment, 50) || 'Delivery or pickup',
    farmerName: sanitizeString(p.farmerName, 80) || 'Meena Devi',
    farmName: sanitizeString(p.farmName, 80) || 'Kaveri Acres',
    verified: Boolean(p.verified),
    status: p.status === 'Active' || p.status === 'Draft' || p.status === 'Sold Out' ? p.status : 'Draft',
  };

  const updated = [created, ...current];
  saveToStorage('ff_products', updated);
  productsCache = updated;
  return created;
};

export const setProductStatus = async (id: number, status: ProductStatus) => {
  const safeId = Math.floor(id);
  const updated = getProducts().map((p) =>
    p.id === safeId
      ? { ...p, status, stock: status === 'Sold Out' ? 0 : p.stock }
      : p
  );
  saveToStorage('ff_products', updated);
  productsCache = updated;
};

export const deleteProduct = async (id: number) => {
  const safeId = Math.floor(id);
  const updated = getProducts().filter((p) => p.id !== safeId);
  saveToStorage('ff_products', updated);
  productsCache = updated;
};

export const listOrders = async (): Promise<Order[]> => {
  return [...getOrders()];
};

export const createOrder = async (
  buyerName: string,
  address: string,
  items: OrderItem[]
): Promise<Order> => {
  const currentOrders = getOrders();
  const numId = currentOrders.length + 1043;
  const sanitizedItems: OrderItem[] = items.map((i) => ({
    productId: Math.floor(i.productId),
    quantity: Math.max(1, Math.floor(i.quantity)),
    unitPrice: Math.max(0, Number(i.unitPrice) || 0),
  }));

  const order: Order = {
    id: `FF-${numId}`,
    buyerName: sanitizeString(buyerName, 80) || 'Buyer',
    address: sanitizeString(address, 300),
    status: 'Placed',
    createdAt: new Date().toISOString().slice(0, 10),
    items: sanitizedItems,
  };

  const updatedOrders = [order, ...currentOrders];
  saveToStorage('ff_orders', updatedOrders);
  ordersCache = updatedOrders;

  // Recheck & decrement stock safely for ordered products
  const currentProducts = getProducts();
  const updatedProducts = currentProducts.map((p) => {
    const ordered = sanitizedItems.find((i) => i.productId === p.id);
    if (!ordered) return p;
    const newStock = Math.max(0, p.stock - ordered.quantity);
    return {
      ...p,
      stock: newStock,
      status: newStock === 0 ? ('Sold Out' as ProductStatus) : p.status,
    };
  });
  saveToStorage('ff_products', updatedProducts);
  productsCache = updatedProducts;

  return order;
};

export const setOrderStatus = async (id: string, status: OrderStatus) => {
  const safeId = sanitizeString(id, 20);
  const updated = getOrders().map((o) => (o.id === safeId ? { ...o, status } : o));
  saveToStorage('ff_orders', updated);
  ordersCache = updated;
};
