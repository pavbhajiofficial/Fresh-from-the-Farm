import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';

export default function FarmerLayout({ children }: { children: ReactNode }) {
  return <div className="farm"><Sidebar /><main className="main">{children}</main></div>;
}
