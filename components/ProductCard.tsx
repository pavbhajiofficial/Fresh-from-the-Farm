import Link from 'next/link';
import type { Product } from '@/lib/types';
import { inr } from '@/lib/format';
import Photo from './Photo';

export default function ProductCard({ p }: { p: Product }) {
  return (
    <Link href={`/product/${p.id}`} className="pc">
      <div className="pic"><Photo p={p} /></div>
      <div className="bd">
        <h3>{p.name}</h3>
        <div className="price">{inr(p.price)}<span className="mute"> / {p.unit}</span></div>
        <div className="mute">{p.stock ? `${p.stock} ${p.unit} available` : 'Sold out'} · {p.location}</div>
        <div className="mute">{p.farmerName}{p.verified && <span className="chip">✔ Verified</span>}</div>
      </div>
    </Link>
  );
}
