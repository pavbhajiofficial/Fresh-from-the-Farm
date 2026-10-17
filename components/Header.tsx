'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';

export default function Header() {
  const path = usePathname() || '';
  const { items } = useCart();
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const on = (p: string) => (path.startsWith(p) ? 'on' : '');

  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="logo">
          fresh from the farm
          <small>FAIR FOR EVERYONE</small>
        </Link>
        <nav aria-label="Main Navigation">
          <Link className={on('/marketplace')} href="/marketplace">
            Marketplace
          </Link>
          <Link className={on('/orders')} href="/orders">
            My orders
          </Link>
          <Link className={on('/cart')} href="/cart">
            Cart ({totalCount})
          </Link>
          <Link className={on('/farmer')} href="/farmer">
            Sell
          </Link>
          <Link className="btn sm" href="/auth">
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
