import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { pool } from '@/lib/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  const name = typeof body.name === 'string'
    ? body.name.trim() : '';

  const contact = typeof body.contact === 'string'
    ? body.contact.trim() : '';

  const location = typeof body.location === 'string'
    ? body.location.trim() : '';

  const password = body.password;
  const role = body.role;

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isPhone = /^\+?[0-9]{10,15}$/.test(contact);

  if (
    name.length < 2 || name.length > 80 ||
    !contact || contact.length > 100 ||
    (!isEmail && !isPhone) ||
    !location || location.length > 100 ||
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72 ||
    (role !== 'farmer' && role !== 'buyer')
  ) {
    return NextResponse.json(
      { error: 'Invalid registration details' },
      { status: 400 }
    );
  }

  const email = isEmail ? contact.toLowerCase() : null;
  const phone = isPhone ? contact : null;

  try {
    const passwordHash = await hash(password, 12);
    const client = await pool.connect();
    let userId: number;

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO users
         (full_name, email, phone, password_hash, role, location)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING user_id`,
        [name, email, phone, passwordHash, role, location]
      );

      userId = result.rows[0].user_id;

      if (role === 'farmer') {
        await client.query(
          `INSERT INTO farmer_profiles
           (user_id, farm_name, verified)
           VALUES ($1, $2, false)`,
          [userId, `${name}'s Farm`]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    await createSession({
      userId,
      role,
      name
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: { id: userId, name, role }
      },
      { status: 201 }
    );
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: 'Email or phone already registered' },
        { status: 409 }
      );
    }

    console.error('Registration error:', error);

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}