'use client';
import { useState } from 'react';

function isSafeImageUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // Allow safe web protocols
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/')) {
    return true;
  }
  // Allow safe raster base64 data URLs only (exclude SVGs which can embed scripts)
  if (/^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return true;
  }
  return false;
}

/** Shows the product photo (imageUrl) or a neutral placeholder until one is uploaded. */
export default function Photo({ p }: { p: { name: string; imageUrl?: string } }) {
  const [loadError, setLoadError] = useState(false);
  const safe = isSafeImageUrl(p.imageUrl);

  if (safe && !loadError && p.imageUrl) {
    return (
      <img
        src={p.imageUrl}
        alt={p.name}
        loading="lazy"
        decoding="async"
        onError={() => setLoadError(true)}
      />
    );
  }

  return (
    <div className="ph" role="img" aria-label={`Photo of ${p.name}`}>
      Photo of<br />{p.name}
    </div>
  );
}
