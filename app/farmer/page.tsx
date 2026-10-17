'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/Badge';
import { listOrders, listProducts } from '@/lib/api';
import { inr, orderTotal } from '@/lib/format';
import type { Order, Product } from '@/lib/types';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [prods, setProds] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listOrders(), listProducts()])
      .then(([ords, prds]) => {
        setOrders(ords);
        setProds(prds);
      })
      .finally(() => setLoading(false));
  }, []);

  const sales = orders
    .filter((o) => o.status !== 'Rejected')
    .reduce((s, o) => s + orderTotal(o), 0);

  const cards: [string, string | number, string][] = [
    ['Total sales', inr(sales), '/farmer/orders'],
    ['Active listings', prods.filter((p) => p.status === 'Active').length, '/farmer/listings'],
    ['Pending orders', orders.filter((o) => o.status === 'Placed').length, '/farmer/orders'],
    ['Units in stock', prods.reduce((s, p) => s + p.stock, 0), '/farmer/listings'],
  ];

  return (
    <>
      <div className="row between">
        <div>
          <h1>Good morning, Meena</h1>
          <p className="mute">Farmer overview & inventory dashboard</p>
        </div>
        <Link className="btn" href="/farmer/new">
          + Add produce
        </Link>
      </div>

      <div className="grid g4" style={{ margin: '32px 0 48px' }}>
        {cards.map(([t, v, href]) => (
          <Link key={t} href={href} className="card">
            <span className="mute">{t}</span>
            <div className="price" style={{ fontSize: 28 }}>
              {loading ? '…' : v}
            </div>
          </Link>
        ))}
      </div>

      <h2>Recent orders</h2>
      {loading ? (
        <div className="card empty">
          <p className="mute">Loading orders…</p>
        </div>
      ) : orders.length ? (
        <div className="card tbl" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 4).map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.id}</b>
                  </td>
                  <td>{o.buyerName}</td>
                  <td>{inr(orderTotal(o))}</td>
                  <td>
                    <Badge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty">
          <p className="mute">No orders placed yet.</p>
        </div>
      )}
    </>
  );
}
