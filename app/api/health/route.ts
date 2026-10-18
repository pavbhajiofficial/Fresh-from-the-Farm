import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM products'
    );

    return NextResponse.json({
      ok: true,
      databaseConnected: true,
      productCount: result.rows[0].count,
    });
  } catch (error) {
    console.error('Database connection failed:', error);

    return NextResponse.json(
      { ok: false, databaseConnected: false },
      { status: 500 }
    );
  }
}