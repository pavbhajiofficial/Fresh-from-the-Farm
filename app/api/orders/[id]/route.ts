import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: Context
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Login required' },
      { status: 401 }
    );
  }

  if (session.role !== 'farmer') {
    return NextResponse.json(
      { error: 'Only farmers can update orders' },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;

    const match = /^FF-(\d+)$/.exec(id);
    const orderId = match ? Number(match[1]) : NaN;

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const status = body?.status;

    const allowed = [
      'Confirmed',
      'Preparing',
      'Ready',
      'Completed',
      'Rejected'
    ];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT set_order_status(
         o.order_id, $2::order_status
       ) AS status
       FROM orders o
       WHERE o.order_id = $1
         AND o.farmer_id = $3`,
      [orderId, status, session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found for this farmer' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: `FF-${orderId}`,
      status: result.rows[0].status
    });

  } catch (error) {
    console.error('Order PATCH error:', error);

    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 400 }
    );
  }
}