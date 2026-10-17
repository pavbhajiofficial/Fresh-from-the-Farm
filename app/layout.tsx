import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { CartProvider } from '@/lib/cart';

export const viewport: Viewport = {
  themeColor: '#F7F4D5',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'fresh from the farm — Fair for everyone',
    template: '%s | fresh from the farm',
  },
  description: 'Good food starts with good connections. Discover fresh produce straight from local farmers with fair and transparent pricing.',
  keywords: ['farmers marketplace', 'fresh produce', 'direct farm to table', 'organic vegetables', 'farm harvest'],
  authors: [{ name: 'fresh from the farm' }],
  metadataBase: new URL('https://freshfromthefarm.example'),
  openGraph: {
    title: 'fresh from the farm — Fair for everyone',
    description: 'Direct marketplace connecting local farmers and buyers with transparent pricing.',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'fresh from the farm — Fair for everyone',
    description: 'Direct marketplace connecting local farmers and buyers with transparent pricing.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
