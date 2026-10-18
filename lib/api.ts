import type {
  Product,
  ProductStatus,
  Order,
  OrderItem,
  OrderStatus
} from './types';

// Communicates with our Next.js backend.
async function api<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || `API error: ${response.status}`
    );
  }

  return data as T;
}

export async function listProducts(
  onlyMine = false
): Promise<Product[]> {
  return api<Product[]>(
    onlyMine ? '/api/products/mine' : '/api/products'
  );
}
// 2. Fetch one product
export async function getProduct(
  id: number
): Promise<Product | null> {
  const products = await listProducts();
  return products.find(p => p.id === id) ?? null;
}

// 3. Create a new product
export async function addProduct(
  product: Omit<Product, 'id'>
): Promise<Product> {
  const result = await api<{
    success: boolean;
    product: { id: number };
  }>('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });

  const products = await listProducts(true);
  const created = products.find(
    p => p.id === result.product.id
  );

  if (!created) {
    throw new Error(
      'Product saved, but could not reload its details.'
    );
  }

  return created;
}

// 4. Update product status
export async function setProductStatus(
  id: number,
  status: ProductStatus
): Promise<void> {
  await api(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

// 5. Delete a product
export async function deleteProduct(
  id: number
): Promise<void> {
  await api(`/api/products/${id}`, {
    method: 'DELETE'
  });
}

// 6. Fetch all orders
export async function listOrders(): Promise<Order[]> {
  return api<Order[]>('/api/orders');
}

// 7. Place a new order
export async function createOrder(
  buyerName: string,
  address: string,
  items: OrderItem[]
): Promise<Order> {
  const result = await api<{
    success: boolean;
    orderId: string;
  }>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      items
    })
  });

  // The API currently uses the seeded demo buyer.
  return {
    id: result.orderId,
    buyerName,
    address,
    items,
    status: 'Placed',
    createdAt: new Date().toISOString().slice(0, 10)
  };
}

// 8. Update order status
export async function setOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await api(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}