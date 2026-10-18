export type Category = 'Vegetables' | 'Fruit' | 'Greens';
export type ProductStatus = 'Active' | 'Draft' | 'Sold Out';
export type OrderStatus = 'Placed' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Rejected';

export type Product = {
  id: number; farmerId?: number; name: string; category: Category; grade: string; description: string;
  price: number; unit: string; stock: number; minOrder: number;
  harvestDate: string; location: string; fulfilment: string;
  farmerName: string; farmName: string; verified: boolean;
  imageUrl?: string; status: ProductStatus;
};
export type OrderItem = { productId: number; quantity: number; unitPrice: number };
export type Order = { id: string; buyerName: string; status: OrderStatus; createdAt: string; address?: string; items: OrderItem[] };
