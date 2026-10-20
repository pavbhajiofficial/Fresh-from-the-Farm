import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { pool } from '@/lib/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const contact = typeof body?.contact === 'string'
    ? body.contact.trim() : '';

  const password = body?.password;

  if (
    !contact ||
    contact.length > 100 ||
    typeof password !== 'string' ||
    !password
  ) {
    return NextResponse.json(
      { error: 'Enter your email/phone and password' },
      { status: 400 }
    );
  }

  try {
    const normalized = contact.toLowerCase();

    const result = await pool.query(
      `SELECT user_id, full_name, role, password_hash
       FROM users
       WHERE email = $1 OR phone = $2
       LIMIT 1`,
      [normalized, contact]
    );

    const user = result.rows[0];

    const valid = user
      ? await compare(password, user.password_hash)
      : false;

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.role !== 'buyer' && user.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Invalid account role' },
        { status: 403 }
      );
    }

    await createSession({
      userId: user.user_id,
      role: user.role,
      name: user.full_name
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.user_id,
        name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}