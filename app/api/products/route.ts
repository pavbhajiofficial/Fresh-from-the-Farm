import { NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';
import type { Product } from '@/lib/types';

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
        p.product_id AS id,
        p.name,
        p.category,
        p.grade,
        p.description,
        p.price::float AS price,
        p.unit,
        p.stock::float AS stock,
        p.min_order::float AS "minOrder",
        to_char(p.harvest_date, 'YYYY-MM-DD') AS "harvestDate",
        p.location,
        p.fulfilment,
        u.full_name AS "farmerName",
        fp.farm_name AS "farmName",
        fp.verified,
        p.image_url AS "imageUrl",
        p.status
      FROM products p
      JOIN farmer_profiles fp ON p.farmer_id = fp.user_id
      JOIN users u ON fp.user_id = u.user_id
      ORDER BY p.created_at DESC;
    `;
    const result = await query<Product>(sql);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database query error in /api/products:', error);
    return NextResponse.json({ error: 'Failed to fetch products from database' }, { status: 500 });
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

  try {
    const body = await req.json();
    const {
      name,
      category,
      grade,
      description,
      price,
      unit,
      stock,
      minOrder,
      harvestDate,
      location,
      imageUrl,
      status,
    } = body;

    const sql = `
      INSERT INTO products (
        farmer_id, name, category, grade, description,
        price, unit, stock, min_order, harvest_date,
        location, image_url, status
      ) VALUES (
        1, $1, $2, $3, $4,
        $5, $6, $7, $8, $9,
        $10, $11, $12
      )
      RETURNING product_id AS id, name, price, stock, status;
    `;
    const params = [
      name,
      category,
      grade,
      description,
      price,
      unit,
      stock,
      minOrder || 1,
      harvestDate || new Date().toISOString().slice(0, 10),
      location,
      imageUrl || null,
      status || 'Draft',
    ];

    const result = await query(sql, params);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Database insert error in /api/products:', error);
    return NextResponse.json({ error: 'Failed to insert product' }, { status: 500 });
  }
}
