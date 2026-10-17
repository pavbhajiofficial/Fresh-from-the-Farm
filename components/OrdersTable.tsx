'use client';
import { useEffect, useState } from 'react';
import { listOrders, listProducts, setOrderStatus } from '@/lib/api';
import { inr, orderTotal } from '@/lib/format';
import type { Order, OrderStatus, Product } from '@/lib/types';
import Badge from './Badge';

const FLOW: OrderStatus[] = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Completed'];
const TABS = ['All', ...FLOW, 'Rejected'];

/** One table for both roles. `farmer` switches on accept / reject / progress actions. */
export default function OrdersTable({ farmer }: { farmer: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [prods, setProds] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');

  const load = () => {
    return Promise.all([listOrders(), listProducts()])
      .then(([ords, prds]) => {
        setOrders(ords);
        setProds(prds);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const names = (o: Order) =>
    o.items
      .map((i) => {
        const product = prods.find((p) => p.id === i.productId);
        return product ? `${product.name} (×${i.quantity})` : `Item #${i.productId} (×${i.quantity})`;
      })
      .filter(Boolean)
      .join(', ');

  const move = (id: string, s: OrderStatus) => setOrderStatus(id, s).then(load);

  const actions = (o: Order) => {
    if (!farmer) return null;
    const i = FLOW.indexOf(o.status);
    if (o.status === 'Placed') {
      return (
        <div className="row" style={{ gap: 8 }}>
          <button className="btn sm" onClick={() => move(o.id, 'Confirmed')}>
            Accept
          </button>
          <button
            className="btn sm rose"
            onClick={() => {
              if (confirm(`Reject order ${o.id}?`)) move(o.id, 'Rejected');
            }}
          >
            Reject
          </button>
        </div>
      );
    }
    return i > 0 && i < 4 ? (
      <button className="btn sm" onClick={() => move(o.id, FLOW[i + 1])}>
        Mark {FLOW[i + 1].toLowerCase()}
      </button>
    ) : null;
  };

  const list = orders.filter((o) => tab === 'All' || o.status === tab);

  return (
    <>
      <h1>{farmer ? 'Orders' : 'My orders'}</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="card empty">
          <p className="mute">Loading orders…</p>
        </div>
      ) : list.length ? (
        <div className="card tbl">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.id}</b>
                    {farmer && <div className="mute">{o.buyerName}</div>}
                    {o.address && <div className="mute" style={{ fontSize: 12 }}>{o.address}</div>}
                  </td>
                  <td>{names(o)}</td>
                  <td>{inr(orderTotal(o))}</td>
                  <td>{o.createdAt}</td>
                  <td>
                    <Badge status={o.status} />
                  </td>
                  <td>{actions(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty">
          <h3>No orders here yet</h3>
          <p className="mute">They will show up as soon as one is placed.</p>
        </div>
      )}
    </>
  );
}
