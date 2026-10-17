'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [['/farmer', 'Dashboard'], ['/farmer/listings', 'My listings'], ['/farmer/new', 'Add produce'], ['/farmer/orders', 'Orders']];
export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="side">
      <Link href="/" className="logo">fresh from the farm</Link>
      {LINKS.map(([href, label]) => <Link key={href} href={href} className={path === href ? 'on' : ''}>{label}</Link>)}
      <Link href="/marketplace" style={{ marginTop: 32 }}>↩ Back to marketplace</Link>
    </aside>
  );
}
