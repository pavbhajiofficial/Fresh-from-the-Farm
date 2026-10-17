'use client';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'buyer' | 'farmer'>('buyer');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'farmer') {
      setRole('farmer');
    }
  }, [searchParams]);

  function validateContact(val: string): boolean {
    const trimmed = val.trim();
    // Valid email check or 10+ digit phone number check
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/.test(trimmed);
    return isEmail || isPhone;
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    const f = new FormData(e.currentTarget);
    const er: Record<string, string> = {};

    const name = String(f.get('name') ?? '').trim();
    const contact = String(f.get('contact') ?? '').trim();
    const location = String(f.get('location') ?? '').trim();
    const password = String(f.get('password') ?? '');

    if (!name) {
      er.name = 'Enter your full name.';
    } else if (name.length < 2) {
      er.name = 'Name must be at least 2 characters.';
    }

    if (!contact) {
      er.contact = 'Enter a phone number or email.';
    } else if (!validateContact(contact)) {
      er.contact = 'Enter a valid email address or phone number.';
    }

    if (!location) {
      er.location = 'Enter your location.';
    }

    if (!password || password.length < 6) {
      er.password = 'Use at least 6 characters.';
    }

    setErrors(er);

    if (Object.keys(er).length === 0) {
      setIsSubmitting(true);
      // Prototype mock auth: redirect to respective portal
      const target = role === 'farmer' ? '/farmer' : '/marketplace';
      router.push(target);
    }
  }

  const field = (
    id: string,
    label: string,
    type = 'text',
    autoComplete?: string,
    maxLength = 100
  ) => (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `${id}-err` : undefined}
      />
      {errors[id] && (
        <div id={`${id}-err`} className="err" role="alert">
          {errors[id]}
        </div>
      )}
    </>
  );

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 56 }}>
      <form className="card" onSubmit={submit} noValidate>
        <h2>Join the farm</h2>
        <p className="mute">Choose how you will use the marketplace.</p>
        <div className="row" style={{ margin: '16px 0' }}>
          {(['farmer', 'buyer'] as const).map((r) => (
            <button
              type="button"
              key={r}
              className={`tab ${role === r ? 'on' : ''}`}
              style={{ flex: 1, padding: 20 }}
              onClick={() => setRole(r)}
            >
              {r === 'farmer' ? 'Farmer · sell produce' : 'Buyer · buy produce'}
            </button>
          ))}
        </div>
        {field('name', 'Full name', 'text', 'name', 80)}
        {field('contact', 'Phone number or email', 'text', 'email', 100)}
        {field('location', role === 'farmer' ? 'Farm location' : 'Location', 'text', 'address-level2', 100)}
        {field('password', 'Password', 'password', 'current-password', 128)}
        <button className="btn" style={{ marginTop: 24 }} disabled={isSubmitting}>
          {isSubmitting ? 'Continuing…' : 'Continue'}
        </button>
        <p className="mute" style={{ marginTop: 16 }}>
          Your details stay private.
        </p>
      </form>
    </div>
  );
}

export default function Auth() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="wrap" style={{ maxWidth: 640, paddingTop: 56 }}>
            <div className="card">
              <h2>Join the farm</h2>
              <p className="mute">Loading…</p>
            </div>
          </div>
        }
      >
        <AuthContent />
      </Suspense>
    </>
  );
}
