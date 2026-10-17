import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <div className="wrap empty" style={{ paddingTop: 96, minHeight: '60vh' }}>
        <h1 style={{ fontSize: 48 }}>404</h1>
        <h2>Page not found</h2>
        <p className="mute">The produce or page you are looking for does not exist or has been moved.</p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
          <Link className="btn" href="/">
            Back to home
          </Link>
          <Link className="btn alt" href="/marketplace">
            Explore marketplace
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
