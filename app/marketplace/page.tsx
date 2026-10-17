'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { listProducts } from '@/lib/api';
import type { Product } from '@/lib/types';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [max, setMax] = useState(500);
  const [loc, setLoc] = useState('All');
  const [sort, setSort] = useState('new');

  useEffect(() => {
    listProducts()
      .then((data) => setAll(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query !== null) {
      setQ(query);
    }
  }, [searchParams]);

  const locs = useMemo(() => {
    const unique = Array.from(new Set(all.map((p) => p.location).filter(Boolean)));
    return ['All', ...unique];
  }, [all]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = all.filter((p) => {
      if (p.status === 'Draft') return false;
      if (cat !== 'All' && p.category !== cat) return false;
      if (p.price > max) return false;
      if (loc !== 'All' && p.location !== loc) return false;
      if (query) {
        const matchName = p.name.toLowerCase().includes(query);
        const matchDesc = p.description?.toLowerCase().includes(query);
        const matchFarmer = p.farmerName.toLowerCase().includes(query);
        const matchLoc = p.location.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchFarmer && !matchLoc) return false;
      }
      return true;
    });

    if (sort === 'lo') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'hi') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [all, q, cat, max, loc, sort]);

  const reset = () => {
    setCat('All');
    setMax(500);
    setLoc('All');
    setQ('');
    setSort('new');
  };

  return (
    <div className="wrap" style={{ paddingTop: 48 }}>
      <div className="row between">
        <div>
          <h1>Marketplace</h1>
          <span className="mute">{loading ? 'Loading produce…' : `${list.length} items`}</span>
        </div>
        <div className="row">
          <input
            aria-label="Search produce"
            style={{ width: 240 }}
            placeholder="Search produce"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            aria-label="Sort produce"
            style={{ width: 180 }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="new">Newest</option>
            <option value="lo">Price: low to high</option>
            <option value="hi">Price: high to low</option>
          </select>
        </div>
      </div>
      <div className="layout">
        <aside className="card">
          <h3>Filters</h3>
          <label>Category</label>
          {['All', 'Vegetables', 'Fruit', 'Greens'].map((c) => (
            <label key={c} style={{ fontWeight: 400, margin: '6px 0' }}>
              <input
                type="radio"
                name="cat"
                style={{ width: 'auto', marginRight: 8 }}
                checked={cat === c}
                onChange={() => setCat(c)}
              />
              {c}
            </label>
          ))}
          <label htmlFor="max">Max price: ₹{max}</label>
          <input
            id="max"
            type="range"
            min={20}
            max={500}
            value={max}
            style={{ padding: 0 }}
            onChange={(e) => setMax(Number(e.target.value))}
          />
          <label htmlFor="loc">Farm location</label>
          <select id="loc" value={loc} onChange={(e) => setLoc(e.target.value)}>
            {locs.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <button className="btn alt sm" style={{ marginTop: 24 }} onClick={reset}>
            Reset filters
          </button>
        </aside>
        {loading ? (
          <div className="card empty">
            <h3>Loading fresh produce…</h3>
          </div>
        ) : list.length ? (
          <div className="grid g3" style={{ alignContent: 'start' }}>
            {list.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="card empty">
            <h3>No produce matches</h3>
            <p className="mute">Try a wider price range or another place.</p>
            <button className="btn" onClick={reset}>
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Marketplace() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="wrap" style={{ paddingTop: 48 }}>
            <h1>Marketplace</h1>
            <p className="mute">Loading marketplace…</p>
          </div>
        }
      >
        <MarketplaceContent />
      </Suspense>
    </>
  );
}
