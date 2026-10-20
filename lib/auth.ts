import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type Role = 'buyer' | 'farmer';

export type Session = {
  userId: number;
  role: Role;
  name: string;
};

const COOKIE_NAME = 'ff_session';

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET is not configured');
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(user: Session) {
  const token = await new SignJWT({
    role: user.role,
    name: user.name
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.userId))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      getSecret(),
      { algorithms: ['HS256'] }
    );

    const userId = Number(payload.sub);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      (payload.role !== 'buyer' && payload.role !== 'farmer') ||
      typeof payload.name !== 'string'
    ) {
      return null;
    }

    return {
      userId,
      role: payload.role,
      name: payload.name
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}