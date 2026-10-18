'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [role, setRole] = useState<'buyer' | 'farmer'>('buyer');

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'login') {
      setMode('login');
    }
    if (searchParams.get('role') === 'farmer') {
      setRole('farmer');
    }
  }, [searchParams]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const endpoint =
        mode === 'login' ? '/api/auth/login' : '/api/auth/register';

      const payload = mode === 'login'
        ? { contact, password }
        : { name, contact, location, password, role };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const destination =
        data.user.role === 'farmer'
          ? '/farmer'
          : '/marketplace';

      router.push(destination);
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 56 }}>
      <form className="card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Join the farm'}</h2>

        <div className="row" style={{ margin: '20px 0' }}>
          <button
            type="button"
            className={`tab ${mode === 'register' ? 'on' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Create account
          </button>
          <button
            type="button"
            className={`tab ${mode === 'login' ? 'on' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Login
          </button>
        </div>

        {mode === 'register' && (
          <>
            <label>Register as</label>
            <div className="row" style={{ marginBottom: 16 }}>
              <button
                type="button"
                className={`tab ${role === 'buyer' ? 'on' : ''}`}
                onClick={() => setRole('buyer')}
              >
                Buyer
              </button>
              <button
                type="button"
                className={`tab ${role === 'farmer' ? 'on' : ''}`}
                onClick={() => setRole('farmer')}
              >
                Farmer
              </button>
            </div>

            <label htmlFor="name">Full name</label>
            <input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
          </>
        )}

        <label htmlFor="contact">Email or phone number</label>
        <input
          id="contact"
          value={contact}
          onChange={e => setContact(e.target.value)}
          required
          maxLength={100}
        />

        {mode === 'register' && (
          <>
            <label htmlFor="location">Location</label>
            <input
              id="location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
              maxLength={100}
            />
          </>
        )}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={mode === 'register' ? 8 : 1}
          maxLength={72}
        />

        {error && (
          <p className="err" role="alert" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ marginTop: 24 }}
        >
          {loading
            ? 'Please wait...'
            : mode === 'login'
              ? 'Login'
              : 'Create account'}
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<p>Loading...</p>}>
        <AuthContent />
      </Suspense>
    </>
  );
}