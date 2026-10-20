
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Login required' },
      { status: 401 }
    );
  }

  if (session.role !== 'farmer') {
    return NextResponse.json(
      { error: 'Farmers only' },
      { status: 403 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT
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
          TO_CHAR(p.harvest_date, 'YYYY-MM-DD'), ''
        ) AS "harvestDate",
        p.location,
        p.fulfilment,
        u.full_name AS "farmerName",
        fp.farm_name AS "farmName",
        fp.verified,
        p.image_url AS "imageUrl",
        p.status
      FROM products p
      JOIN farmer_profiles fp
        ON fp.user_id = p.farmer_id
      JOIN users u
        ON u.user_id = p.farmer_id
      WHERE p.farmer_id = $1
      ORDER BY p.product_id DESC`,
      [session.userId]
    );

    return NextResponse.json(result.rows, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Farmer products error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
