'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listProducts } from '@/lib/api';
import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) {
      router.push(`/marketplace?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/marketplace');
    }
  };

  return (
    <>
      <form className="search" onSubmit={handleSearch}>
        <input
          aria-label="Search produce"
          placeholder="Search tomatoes, spinach…"
          maxLength={100}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn alt">
          Search
        </button>
      </form>
      <div className="ctas">
        <Link className="btn" href="/marketplace">
          Explore produce
        </Link>
        <Link className="btn alt" href="/auth?role=farmer">
          Sell your harvest
        </Link>
      </div>
    </>
  );
}

export function Featured() {
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProducts()
      .then((l) => setList(l.filter((p) => p.status === 'Active').slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid g3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="card empty" style={{ minHeight: 280 }}>
            <p className="mute">Loading produce…</p>
          </div>
        ))}
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className="card empty">
        <p className="mute">No active produce listed this week.</p>
      </div>
    );
  }

  return (
    <div className="grid g3">
      {list.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
