import type { Order } from './types';
export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
export const orderTotal = (o: Order) => o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
