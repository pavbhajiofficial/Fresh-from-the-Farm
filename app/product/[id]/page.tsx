'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Photo from '@/components/Photo';
import { getProduct } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { inr } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { add } = useCart();
  const [p, setP] = useState<Product | null | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    if (isNaN(numId) || numId <= 0) {
      setP(null);
      return;
    }
    getProduct(numId).then((x) => {
      setP(x);
      if (x) {
        const initialQty = x.stock > 0 ? Math.min(x.stock, Math.max(1, x.minOrder || 1)) : 0;
        setQty(initialQty);
      }
    });
  }, [id]);

  if (p === undefined) {
    return (
      <>
        <Header />
        <div className="wrap" style={{ paddingTop: 48 }}>
          <p className="mute">Loading product details…</p>
        </div>
      </>
    );
  }

  if (p === null) {
    return (
      <>
        <Header />
        <div className="wrap empty" style={{ paddingTop: 48 }}>
          <h2>Product not found</h2>
          <p className="mute">This harvest listing may have been removed.</p>
          <Link className="btn" href="/marketplace">
            Back to marketplace
          </Link>
        </div>
      </>
    );
  }

  const step = (d: number) => {
    setQty((current) => {
      const min = Math.max(1, p.minOrder || 1);
      const next = current + d;
      if (d < 0 && next < min) return current;
      if (d > 0 && p.stock > 0 && next > p.stock) return current;
      return next;
    });
  };

  const addToCart = (buy: boolean) => {
    if (p.stock <= 0 || qty <= 0) return;
    add({ productId: p.id, quantity: qty });
    if (buy) {
      router.push('/cart');
    } else {
      setMsg(`Added ${qty} ${p.unit} to your cart.`);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const isAvailable = p.status === 'Active' && p.stock > 0;

  return (
    <>
      <Header />
      <div className="wrap" style={{ paddingTop: 32 }}>
        <p className="mute">
          <Link href="/marketplace" style={{ textDecoration: 'underline' }}>
            ← Marketplace
          </Link>{' '}
          / {p.category} / {p.name}
        </p>
        <div className="grid g2" style={{ marginTop: 24 }}>
          <div
            className="pic"
            style={{
              minHeight: 420,
              height: 'auto',
              border: '1.5px solid var(--dk)',
              borderRadius: 18,
            }}
          >
            <Photo p={p} />
          </div>
          <div>
            <span className="badge">{p.category}</span>
            <h1 style={{ margin: '12px 0' }}>{p.name}</h1>
            <div className="price" style={{ fontSize: 30 }}>
              {inr(p.price)} <span className="mute">/ {p.unit}</span>
            </div>
            <p style={{ marginTop: 16 }}>{p.description}</p>
            <p className="mute">
              {p.grade} · Harvested {p.harvestDate} · Minimum order {p.minOrder} {p.unit} ·{' '}
              {p.stock ? `${p.stock} ${p.unit} in stock` : 'Sold out'}
              <br />
              {p.fulfilment} · {p.location}
            </p>
            {isAvailable ? (
              <>
                <div className="row" style={{ margin: '24px 0' }}>
                  <div className="qty">
                    <button
                      aria-label="Decrease quantity"
                      disabled={qty <= (p.minOrder || 1)}
                      onClick={() => step(-1)}
                    >
                      −
                    </button>
                    <span>{qty}</span>
                    <button
                      aria-label="Increase quantity"
                      disabled={qty >= p.stock}
                      onClick={() => step(1)}
                    >
                      +
                    </button>
                  </div>
                  <b>Total: {inr(qty * p.price)}</b>
                </div>
                <div className="row">
                  <button className="btn" onClick={() => addToCart(false)}>
                    Add to cart
                  </button>
                  <button className="btn rose" onClick={() => addToCart(true)}>
                    Buy now
                  </button>
                </div>
                {msg && (
                  <p role="status" style={{ marginTop: 16, fontWeight: 600 }}>
                    {msg}
                  </p>
                )}
              </>
            ) : (
              <span className="badge bad">✖ Sold out</span>
            )}
            <div className="card" style={{ marginTop: 32 }}>
              <h3>
                {p.farmerName}
                {p.verified && <span className="chip">✔ Verified</span>}
              </h3>
              <span className="mute">
                {p.farmName}, {p.location}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
