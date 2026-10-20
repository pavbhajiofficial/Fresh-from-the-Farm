import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 2 * 1024 * 1024;
const FOLDER = 'fresh-from-the-farm/products';

function supportedImage(data: Uint8Array, kind: string): boolean {
  if (kind === 'image/jpeg') {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (kind === 'image/png') {
    return data.length >= 8 && [137,80,78,71,13,10,26,10].every((n, i) => data[i] === n);
  }
  if (kind === 'image/webp') {
    const tag = (n: number) => String.fromCharCode(...data.slice(n, n + 4));
    return data.length >= 12 && tag(0) === 'RIFF' && tag(8) === 'WEBP';
  }
  return false;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Please log in' }, { status: 401 });
  if (session.role !== 'farmer') {
    return NextResponse.json({ error: 'Only farmers can upload product photos' }, { status: 403 });
  }
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    return NextResponse.json(
      { error: 'Photo uploads are not configured yet. Use a public HTTPS photo link instead.' },
      { status: 503 }
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloud)) {
    return NextResponse.json({ error: 'Invalid image hosting configuration' }, { status: 500 });
  }
  const payload = await request.formData().catch(() => null);
  const photo = payload?.get('photo');
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: 'Choose a JPEG, PNG, or WebP image' }, { status: 400 });
  }
  if (photo.size === 0 || photo.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 2 MB' }, { status: 413 });
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP photos are supported' }, { status: 400 });
  }
  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!supportedImage(bytes, photo.type)) {
    return NextResponse.json({ error: 'Image file format is invalid' }, { status: 400 });
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha1')
    .update(`folder=${FOLDER}&timestamp=${timestamp}${secret}`)
    .digest('hex');
  const form = new FormData();
  form.append('file', new Blob([photo], { type: photo.type }), 'produce-photo');
  form.append('folder', FOLDER);
  form.append('timestamp', String(timestamp));
  form.append('api_key', key);
  form.append('signature', signature);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST', body: form, cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    const url = data.secure_url;
    if (!response.ok || typeof url !== 'string' ||
        !url.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`)) {
      console.error('Photo upload provider rejected request:', response.status);
      return NextResponse.json({ error: 'Photo hosting service could not upload the image' }, { status: 502 });
    }
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Photo upload network error:', error);
    return NextResponse.json({ error: 'Image hosting service is unavailable' }, { status: 502 });
  }
}
