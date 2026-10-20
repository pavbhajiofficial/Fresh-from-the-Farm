import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { validProductImageUrl } from '@/lib/image-url';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Please log in' }, { status: 401 });
  if (session.role !== 'farmer') {
    return NextResponse.json({ error: 'Only farmers can edit images' }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.imageUrl !== 'string') {
    return NextResponse.json({ error: 'Image URL must be a string' }, { status: 400 });
  }
  const imageUrl = body.imageUrl.trim();
  if (imageUrl && !validProductImageUrl(imageUrl)) {
    return NextResponse.json({ error: 'Use a valid public HTTPS image URL' }, { status: 400 });
  }
  try {
    const result = await pool.query(
      `UPDATE products SET image_url = $1
       WHERE product_id = $2 AND farmer_id = $3
       RETURNING product_id AS id, image_url AS "imageUrl"`,
      [imageUrl || null, Number(id), session.userId]
    );
    if (!result.rowCount) {
      return NextResponse.json({ error: 'Product not found or not owned by you' }, { status: 404 });
    }
    return NextResponse.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Product image update error:', error);
    return NextResponse.json({ error: 'Failed to update product image' }, { status: 500 });
  }
}
