import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { error: 'PostgreSQL database not configured. See .env.example' },
      { status: 503 }
    );
  }

  try {
    const sql = `
      SELECT
        CONCAT('FF-', o.order_id) AS id,
        u.full_name AS "buyerName",
        o.address,
        o.status,
        to_char(o.created_at, 'YYYY-MM-DD') AS "createdAt",
        COALESCE(
          json_agg(
            json_build_object(
              'productId', oi.product_id,
              'quantity', oi.quantity::float,
              'unitPrice', oi.unit_price::float
            )
          ) FILTER (WHERE oi.product_id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      JOIN users u ON o.buyer_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      GROUP BY o.order_id, u.full_name, o.address, o.status, o.created_at
      ORDER BY o.created_at DESC;
    `;
    const result = await pool.query(sql);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database query error in /api/orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders from database' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { error: 'PostgreSQL database not configured.' },
      { status: 503 }
    );
  }

  const client = await pool.connect();

  try {
    const body = await req.json();
    const { buyerName, address, items } = body;

    // DBMS Course Requirement: ACID Transaction with Row-Level Locking (SELECT ... FOR UPDATE)
    await client.query('BEGIN');

    // 1. Create order record
    const orderRes = await client.query(
      `INSERT INTO orders (buyer_id, farmer_id, status, address)
       VALUES (5, 1, 'Placed', $1)
       RETURNING order_id;`,
      [address || 'Delivery']
    );
    const orderId = orderRes.rows[0].order_id;

    // 2. Validate inventory and decrement stock with row locks
    for (const item of items) {
      const stockRes = await client.query(
        `SELECT stock, name FROM products WHERE product_id = $1 FOR UPDATE;`,
        [item.productId]
      );

      if (stockRes.rows.length === 0) {
        throw new Error(`Product #${item.productId} does not exist`);
      }

      const currentStock = Number(stockRes.rows[0].stock);
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${stockRes.rows[0].name}. Available: ${currentStock}`);
      }

      // Decrement stock
      const newStock = currentStock - item.quantity;
      await client.query(
        `UPDATE products
         SET stock = $1, status = CASE WHEN $1 = 0 THEN 'Sold Out'::product_status ELSE status END
         WHERE product_id = $2;`,
        [newStock, item.productId]
      );

      // Insert line item
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4);`,
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        id: `FF-${orderId}`,
        buyerName: buyerName || 'Buyer',
        address,
        status: 'Placed',
        createdAt: new Date().toISOString().slice(0, 10),
        items,
      },
      { status: 201 }
    );
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back in /api/orders:', error);
    return NextResponse.json(
      { error: error?.message || 'Transaction failed' },
      { status: 400 }
    );
  } finally {
    client.release();
  }
}
