import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please log in' },
        { status: 401 }
      );
    }

    const result = await pool.query(`
      SELECT
        'FF-' || o.order_id AS id,
        u.full_name AS "buyerName",
        o.status,
        o.address,
        TO_CHAR(o.created_at, 'YYYY-MM-DD') AS "createdAt",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'productId', oi.product_id,
              'quantity', oi.quantity::float8,
              'unitPrice', oi.unit_price::float8
            )
          ) FILTER (WHERE oi.product_id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      JOIN users u ON u.user_id = o.buyer_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE
        ($2::text = 'buyer' AND o.buyer_id = $1)
        OR
        ($2::text = 'farmer' AND o.farmer_id = $1)
      GROUP BY o.order_id, u.full_name
      ORDER BY o.created_at DESC
    `, [session.userId, session.role]);

    return NextResponse.json(result.rows, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Orders GET error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Login required' },
        { status: 401 }
      );
    }

    if (session.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can place orders' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    const address = body?.address;
    const items = body?.items;

    if (
      typeof address !== 'string' ||
      !address.trim() ||
      address.length > 300 ||
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 20 ||
      items.some(
        (item: unknown) => {
          if (!item || typeof item !== 'object') return true;

          const value = item as {
            productId?: unknown;
            quantity?: unknown;
          };

          return (
            !Number.isSafeInteger(value.productId) ||
            Number(value.productId) <= 0 ||
            !Number.isSafeInteger(value.quantity) ||
            Number(value.quantity) <= 0
          );
        }
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid order details' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT place_order($1, $2, $3::jsonb) AS order_id`,
      [
        session.userId,
        address.trim(),
        JSON.stringify(items)
      ]
    );

    return NextResponse.json(
      {
        success: true,
        orderId: `FF-${result.rows[0].order_id}`
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Order POST error:', error);

    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 400 }
    );
  }
}