'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/Badge';
import Photo from '@/components/Photo';
import { deleteProduct, listProducts, setProductStatus } from '@/lib/api';
import { inr } from '@/lib/format';
import type { Product } from '@/lib/types';

const TABS = ['All', 'Active', 'Draft', 'Sold Out'];

export default function Listings() {
  const [prods, setProds] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [q, setQ] = useState('');

  const load = () => {
    return listProducts()
      .then(setProds)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const trimmedQuery = q.trim().toLowerCase();
  const list = prods.filter(
    (p) =>
      (tab === 'All' || p.status === tab) &&
      (!trimmedQuery || p.name.toLowerCase().includes(trimmedQuery))
  );

  return (
    <>
      <div className="row between">
        <h1>My listings</h1>
        <Link className="btn" href="/farmer/new">
          + Add produce
        </Link>
      </div>
      <input
        aria-label="Search listings"
        placeholder="Search by name"
        style={{ maxWidth: 320, marginTop: 16 }}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
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
          <p className="mute">Loading listings…</p>
        </div>
      ) : list.length ? (
        list.map((p) => (
          <div className="card row" key={p.id} style={{ marginBottom: 16 }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1.5px solid var(--dk)',
                flex: 'none',
              }}
            >
              <Photo p={p} />
            </div>
            <Link href={`/product/${p.id}`} style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              <span className="mute">
                {inr(p.price)} / {p.unit} · {p.stock} in stock · {p.location}
              </span>
            </Link>
            <Badge status={p.status} />
            <div className="row" style={{ gap: 8 }}>
              {p.status === 'Active' && (
                <button
                  className="btn sm alt"
                  onClick={() => setProductStatus(p.id, 'Sold Out').then(load)}
                >
                  Mark sold out
                </button>
              )}
              {p.status === 'Sold Out' && (
                <button
                  className="btn sm alt"
                  onClick={() => setProductStatus(p.id, 'Active').then(load)}
                >
                  Reactivate
                </button>
              )}
              {p.status === 'Draft' && (
                <button
                  className="btn sm"
                  onClick={() => setProductStatus(p.id, 'Active').then(load)}
                >
                  Publish listing
                </button>
              )}
              <button
                className="btn sm rose"
                onClick={() => {
                  if (confirm(`Delete ${p.name}? This action cannot be undone.`)) {
                    deleteProduct(p.id).then(load);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="card empty">
          <h3>No listings found</h3>
          <p className="mute">Add your first harvest so buyers can find it.</p>
          <Link className="btn" href="/farmer/new">
            Add produce
          </Link>
        </div>
      )}
    </>
  );
}
