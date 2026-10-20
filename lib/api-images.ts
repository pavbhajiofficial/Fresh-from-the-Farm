/** Image management; product ownership is always checked by the backend. */
async function messageFromResponse(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return typeof data.error === 'string'
    ? data.error
    : `Image request failed (${response.status})`;
}

export async function uploadProductImage(file: File): Promise<string> {
  const payload = new FormData();
  payload.append('photo', file);
  const response = await fetch('/api/images/upload', {
    method: 'POST', body: payload, cache: 'no-store'
  });
  if (!response.ok) throw new Error(await messageFromResponse(response));
  const data = await response.json();
  if (typeof data.url !== 'string') throw new Error('Upload returned no image URL');
  return data.url;
}

export async function updateProductImage(id: number, imageUrl: string) {
  const response = await fetch(`/api/products/${id}/image`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(await messageFromResponse(response));
}
