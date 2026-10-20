
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { validProductImageUrl } from '@/lib/image-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRODUCT_COLUMNS = `
  p.product_id AS id,
  p.farmer_id AS "farmerId",
  p.name,
  p.category,
  p.grade,
  COALESCE(p.description, '') AS description,
  p.price::float8 AS price,
  p.unit,
  p.stock::float8 AS stock,
  p.min_order::float8 AS "minOrder",
  COALESCE(
    TO_CHAR(p.harvest_date, 'YYYY-MM-DD'),
    ''
  ) AS "harvestDate",
  p.location,
  p.fulfilment,
  u.full_name AS "farmerName",
  fp.farm_name AS "farmName",
  fp.verified,
  p.image_url AS "imageUrl",
  p.status
`;

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT ${PRODUCT_COLUMNS}
      FROM products p
      JOIN users u
        ON u.user_id = p.farmer_id
      JOIN farmer_profiles fp
        ON fp.user_id = p.farmer_id
      WHERE p.status IN ('Active', 'Sold Out')
      ORDER BY p.product_id DESC
    `);

    return NextResponse.json(result.rows, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Products GET error:', error);

    return NextResponse.json(
      { error: 'Failed to load products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Please log in' },
        { status: 401 }
      );
    }

    if (session.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can add products' },
        { status: 403 }
      );
    }

    const raw = await request.json().catch(() => null);
    const body = raw?.product ?? raw;

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid product data' },
        { status: 400 }
      );
    }

    const name = String(body.name ?? '').trim();
    const category = String(body.category ?? '').trim();
    const grade = String(body.grade ?? '').trim();
    const description = String(body.description ?? '').trim();
    const unit = String(body.unit ?? 'kg').trim();
    const location = String(body.location ?? '').trim();
    const fulfilment = String(
      body.fulfilment ?? 'Delivery or pickup'
    ).trim();

    const price = Number(body.price);
    const stock = Number(body.stock);
    const minOrder = Number(body.minOrder ?? 1);

    const status = String(body.status ?? 'Draft');
    const harvestDate = body.harvestDate || null;

    const imageUrl =
      typeof body.imageUrl === 'string'
        ? body.imageUrl
        : null;

    if (
      !name ||
      !grade ||
      !location ||
      !['Vegetables', 'Fruit', 'Greens'].includes(category) ||
      !['Active', 'Draft', 'Sold Out'].includes(status) ||
      name.length > 100 ||
      grade.length > 100 ||
      location.length > 100 ||
      description.length > 1000 ||
      !unit ||
      unit.length > 30 ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 1000000 ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      stock > 1000000 ||
      !Number.isFinite(minOrder) ||
      minOrder <= 0 ||
      minOrder > 1000000 ||
      (status === 'Active' && stock <= 0) ||
      (stock > 0 && minOrder > stock)
    ) {
      return NextResponse.json(
        { error: 'Please provide valid product details' },
        { status: 400 }
      );
    }

    if (
      harvestDate !== null &&
      (
        typeof harvestDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(harvestDate)
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid harvest date' },
        { status: 400 }
      );
    }

    if (imageUrl && !validProductImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: 'Invalid product image' },
        { status: 400 }
      );
    }

    const created = await pool.query(
      `INSERT INTO products (
        farmer_id,
        name,
        category,
        grade,
        description,
        price,
        unit,
        stock,
        min_order,
        harvest_date,
        location,
        fulfilment,
        image_url,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14::product_status
      )
      RETURNING product_id`,
      [
        session.userId,
        name,
        category,
        grade,
        description,
        price,
        unit,
        status === 'Sold Out' ? 0 : stock,
        minOrder,
        harvestDate,
        location,
        fulfilment,
        imageUrl,
        status
      ]
    );

    const result = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
       FROM products p
       JOIN users u
         ON u.user_id = p.farmer_id
       JOIN farmer_profiles fp
         ON fp.user_id = p.farmer_id
       WHERE p.product_id = $1`,
      [created.rows[0].product_id]
    );

    const product = result.rows[0];

    return NextResponse.json(
      { ...product, product, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Products POST error:', error);

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
