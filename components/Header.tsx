
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';

type User = {
  userId: number;
  role: 'buyer' | 'farmer';
  name: string;
};

export default function Header() {
  const path = usePathname() || '';
  const router = useRouter();
  const { items, clear } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const totalCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const on = (p: string) =>
    path.startsWith(p) ? 'on' : '';

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'same-origin'
        });

        if (!response.ok) {
          throw new Error('Session check failed');
        }

        const data = await response.json();

        if (active) {
          setUser(
            data.authenticated ? data.user : null
          );
        }
      } catch {
        if (active) {
          setUser(null);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [path]);

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Remove cart data when switching accounts
      clear();

      // Update login state
      setUser(null);

      // Redirect to login page
      router.replace('/auth?mode=login');
      router.refresh();

    } catch {
      alert('Logout failed. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="logo">
          fresh from the farm
          <small>FAIR FOR EVERYONE</small>
        </Link>

        <nav aria-label="Main Navigation">

          <Link
            className={on('/marketplace')}
            href="/marketplace"
          >
            Marketplace
          </Link>

          {user?.role === 'buyer' && (
            <>
              <Link
                className={on('/orders')}
                href="/orders"
              >
                My orders
              </Link>

              <Link
                className={on('/cart')}
                href="/cart"
              >
                Cart ({totalCount})
              </Link>
            </>
          )}

          {(!user || user.role === 'farmer') && (
            <Link
              className={on('/farmer')}
              href="/farmer"
            >
              Sell
            </Link>
          )}

          {user ? (
            <button
              type="button"
              className="btn sm"
              disabled={loggingOut}
              onClick={logout}
            >
              {loggingOut
                ? 'Logging out...'
                : 'Log out'}
            </button>
          ) : (
            <Link
              className="btn sm"
              href="/auth?mode=login"
            >
              Log in
            </Link>
          )}

        </nav>
      </div>
    </header>
  );
}
