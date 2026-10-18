'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createOrder, listProducts } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { inr } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function Cart() {
  const router = useRouter();
  const { items, setQty, remove, clear } = useCart();
  const [prods, setProds] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pickup, setPickup] = useState(false);
  const [address, setAddress] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    listProducts()
      .then((data) => setProds(data))
      .finally(() => setLoading(false));
  }, []);

  const lines = items.flatMap((i) => {
    const p = prods.find((x) => x.id === i.productId);
    return p ? [{ p, q: i.quantity }] : [];
  });

  const total = lines.reduce((s, l) => s + l.p.price * l.q, 0);

  const step = (p: Product, q: number, d: number) => {
    const next = q + d;
    const min = Math.max(1, p.minOrder || 1);
    if (d < 0 && next < min) {
      return;
    }
    if (d > 0 && p.stock > 0 && next > p.stock) {
      return;
    }
    setQty(p.id, next);
  };

  async function place() {
    if (submitting) return;

    if (!pickup && !address.trim()) {
      setErr('Enter a delivery address, or choose pickup.');
      return;
    }

    // Verify stock availability
    for (const line of lines) {
      if (line.p.stock <= 0) {
        setErr(`${line.p.name} is currently out of stock. Please remove it to proceed.`);
        return;
      }
      if (line.q > line.p.stock) {
        setErr(`Only ${line.p.stock} ${line.p.unit} of ${line.p.name} available. Please adjust quantity.`);
        return;
      }
    }

    const farmerIds = new Set(lines.map(l => l.p.farmerId));
    if (farmerIds.size > 1 || farmerIds.has(undefined)) {
      setErr('Please order produce from one farmer at a time. Remove items from other farms first.');
      return;
    }

    try {
      setSubmitting(true);
      setErr('');
      await createOrder(
        'You',
        pickup ? 'Pickup from farm' : address.trim(),
        lines.map((l) => ({ productId: l.p.id, quantity: l.q, unitPrice: l.p.price }))
      );
      clear();
      router.push('/orders');
    } catch {
      setErr('Failed to place order. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="wrap" style={{ paddingTop: 96, textAlign: 'center' }}>
          <h2>Loading your cart…</h2>
        </div>
      </>
    );
  }

  if (!lines.length) {
    return (
      <>
        <Header />
        <div className="wrap empty" style={{ paddingTop: 96 }}>
          <h2>Your cart is empty</h2>
          <p className="mute">Add some produce to get started.</p>
          <Link className="btn" href="/marketplace">
            Explore produce
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="wrap" style={{ paddingTop: 48 }}>
        <h1>Cart and checkout</h1>
        <div className="layout" style={{ gridTemplateColumns: '1fr 340px' }}>
          <div>
            {lines.map(({ p, q }) => (
              <div className="card row" key={p.id} style={{ marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{p.name}</h3>
                  <span className="mute">
                    {inr(p.price)} / {p.unit} · {p.farmerName} (Min: {p.minOrder} {p.unit})
                  </span>
                </div>
                <div className="qty">
                  <button
                    aria-label={`Decrease quantity of ${p.name}`}
                    disabled={q <= (p.minOrder || 1)}
                    onClick={() => step(p, q, -1)}
                  >
                    −
                  </button>
                  <span>{q}</span>
                  <button
                    aria-label={`Increase quantity of ${p.name}`}
                    disabled={p.stock > 0 && q >= p.stock}
                    onClick={() => step(p, q, 1)}
                  >
                    +
                  </button>
                </div>
                <b style={{ width: 90, textAlign: 'right' }}>{inr(p.price * q)}</b>
                <button
                  className="btn alt sm"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => remove(p.id)}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="card">
              <h3>Fulfilment</h3>
              <label style={{ fontWeight: 400 }}>
                <input
                  type="radio"
                  name="fulfilment"
                  style={{ width: 'auto', marginRight: 8 }}
                  checked={!pickup}
                  onChange={() => setPickup(false)}
                />
                Delivery
              </label>
              <label style={{ fontWeight: 400 }}>
                <input
                  type="radio"
                  name="fulfilment"
                  style={{ width: 'auto', marginRight: 8 }}
                  checked={pickup}
                  onChange={() => setPickup(true)}
                />
                Pickup from farm
              </label>
              {!pickup && (
                <>
                  <label htmlFor="addr">Delivery address</label>
                  <textarea
                    id="addr"
                    rows={2}
                    maxLength={300}
                    placeholder="Street, area, city, pincode"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErr('');
                    }}
                  />
                </>
              )}
              {err && <div className="err" role="alert">{err}</div>}
              <p className="mute" style={{ marginTop: 16 }}>
                Payment terms are agreed directly with each farmer.
              </p>
            </div>
          </div>
          <aside className="card" style={{ position: 'sticky', top: 108 }}>
            <h3>Order summary</h3>
            <p className="row between">
              <span>Items</span>
              <b>{inr(total)}</b>
            </p>
            <p className="row between">
              <span>Delivery</span>
              <span className="mute">Agreed with farmer</span>
            </p>
            <p
              className="row between"
              style={{
                fontSize: 20,
                fontWeight: 700,
                borderTop: '1.5px solid var(--line)',
                paddingTop: 16,
              }}
            >
              <span>Total</span>
              <span>{inr(total)}</span>
            </p>
            <button
              className="btn"
              style={{ width: '100%' }}
              disabled={submitting}
              onClick={place}
            >
              {submitting ? 'Placing order…' : 'Place order'}
            </button>
          </aside>
        </div>
      </div>
    </>
  );
}
