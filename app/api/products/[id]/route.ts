import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

type Context = {
  params: Promise<{ id: string }>;
};

async function authorize() {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Please log in' },
        { status: 401 }
      )
    };
  }

  if (session.role !== 'farmer') {
    return {
      error: NextResponse.json(
        { error: 'Only farmers can modify products' },
        { status: 403 }
      )
    };
  }

  return { session };
}

export async function PATCH(
  request: Request,
  context: Context
) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;

    if (!/^[1-9]\d*$/.test(id) ||
        !Number.isSafeInteger(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const status = body?.status;

    if (!['Active', 'Draft', 'Sold Out'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid product status' },
        { status: 400 }
      );
    }

    const hasStock = body !== null &&
      Object.prototype.hasOwnProperty.call(body, 'stock');

    if (
      hasStock &&
      (typeof body.stock !== 'number' ||
       !Number.isFinite(body.stock) ||
       body.stock < 0 ||
       body.stock >= 100000000)
    ) {
      return NextResponse.json(
        { error: 'Invalid stock quantity' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE products
       SET
         stock = CASE
           WHEN $1::product_status = 'Sold Out' THEN 0
           WHEN $4::numeric IS NOT NULL THEN $4
           ELSE stock
         END,
         status = $1::product_status
       WHERE product_id = $2
         AND farmer_id = $3
         AND (
           $1::product_status <> 'Active'
           OR CASE
             WHEN $4::numeric IS NOT NULL THEN $4
             ELSE stock
           END > 0
         )
       RETURNING
         product_id AS id,
         status,
         stock::float8 AS stock`,
      [
        status,
        Number(id),
        auth.session!.userId,
        hasStock ? body.stock : null
      ]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        {
          error: 'Product not found, not owned by you, or needs restocking'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Product update error:', error);

       return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: Context
) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;

    if (
      !/^[1-9]\d*$/.test(id) ||
      !Number.isSafeInteger(Number(id))
    ) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM products
       WHERE product_id = $1
       AND farmer_id = $2
       RETURNING product_id`,
      [Number(id), auth.session!.userId]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: 'Product not found or not owned by you' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product delete error:', error);

    if ((error as { code?: string }).code === '23503') {
      return NextResponse.json(
        { error: 'Cannot delete a product used in an order' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}