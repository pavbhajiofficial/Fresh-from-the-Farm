import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getSession } from '@/lib/auth';

export default async function FarmerLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/auth?mode=login');
  }

  if (session.role !== 'farmer') {
    redirect('/marketplace');
  }

  return (
    <div className="farm">
      <Sidebar />
      <main className="main">
        {children}
      </main>
    </div>
  );
}