'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addProduct } from '@/lib/api';
import { uploadProductImage } from '@/lib/api-images';
import type { Category, ProductStatus } from '@/lib/types';

const REQUIRED = ['name', 'grade', 'location', 'price', 'stock', 'minOrder', 'harvestDate'];
const NUMERIC = ['price', 'stock', 'minOrder'];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export default function AddProduce() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string>();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function pickPhoto(file?: File) {
    if (!file) return;

    // Security: Validate image MIME type strictly (disallow SVG/scripts)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Please select JPEG, PNG, or WebP.',
      }));
      return;
    }

    // Security & DoS: Enforce file size limit
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Image size exceeds the 2 MB limit.',
      }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.photo;
      return next;
    });

    setPhotoFile(file);
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === 'string') {
        setImage(r.result);
      }
    };
    r.readAsDataURL(file);
  }

  async function save(status: ProductStatus) {
    if (isSubmitting) return;

    const f = new FormData(form.current!);
    const v = (k: string) => String(f.get(k) ?? '').trim();
    const er: Record<string, string> = {};

    for (const k of REQUIRED) {
      if (!v(k)) er[k] = 'This field is required.';
    }

    for (const k of NUMERIC) {
      const val = Number(v(k));
      if (v(k) && !(val > 0)) {
        er[k] = 'Enter a number above 0.';
      } else if (val > 1000000) {
        er[k] = 'Value cannot exceed 1,000,000.';
      }
    }

    const stockNum = Number(v('stock')) || 0;
    const minOrderNum = Number(v('minOrder')) || 0;
    if (stockNum > 0 && minOrderNum > 0 && minOrderNum > stockNum) {
      er.minOrder = 'Minimum order cannot exceed total available stock.';
    }

    setErrors(er);

    if (status === 'Active' && Object.keys(er).length) return;

    try {
      setIsSubmitting(true);
      let finalImageUrl = photoUrl.trim();
      if (photoFile) {
        finalImageUrl = await uploadProductImage(photoFile);
      }
      await addProduct({
        name: v('name'),
        category: (v('category') as Category) || 'Vegetables',
        grade: v('grade'),
        description: v('description'),
        price: Number(v('price')) || 0,
        unit: v('unit') || 'kg',
        stock: Number(v('stock')) || 0,
        minOrder: Number(v('minOrder')) || 1,
        harvestDate: v('harvestDate'),
        location: v('location'),
        fulfilment: 'Delivery or pickup',
        farmerName: 'Meena Devi',
        farmName: 'Kaveri Acres',
        verified: true,
        imageUrl: finalImageUrl || undefined,
        status,
      });
      router.push('/farmer/listings');
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error instanceof Error ? error.message : 'Failed to save product. Please try again.' }));
      setIsSubmitting(false);
    }
  }

  const field = (id: string, label: string, type = 'text', maxLen = 100) => (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        maxLength={maxLen}
        aria-invalid={!!errors[id]}
      />
      {errors[id] && <div className="err" role="alert">{errors[id]}</div>}
    </>
  );

  return (
    <>
      <p className="mute">Listings / New</p>
      <h1>Add produce</h1>
      <form
        ref={form}
        className="grid g2 card"
        style={{ marginTop: 16 }}
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          {field('name', 'Product name', 'text', 80)}
          <label htmlFor="category">Category</label>
          <select id="category" name="category">
            <option>Vegetables</option>
            <option>Fruit</option>
            <option>Greens</option>
          </select>
          {field('grade', 'Variety or grade', 'text', 50)}
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={4} maxLength={500} />
          {field('location', 'Farm location', 'text', 80)}
        </div>
        <div>
          {field('price', 'Price per unit (₹)', 'number')}
          {field('stock', 'Available quantity', 'number')}
          <label htmlFor="unit">Unit</label>
          <select id="unit" name="unit">
            <option>kg</option>
            <option>bunch</option>
            <option>crate</option>
          </select>
          {field('minOrder', 'Minimum order', 'number')}
          {field('harvestDate', 'Harvest date', 'date')}
          <label htmlFor="photoUrl">Photo HTTPS link (optional)</label>
          <input
            id="photoUrl"
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://example.com/fresh-produce.jpg"
            maxLength={2048}
          />
          <label htmlFor="photo">Or upload photo (needs Cloudinary setup)</label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
          {errors.photo && <div className="err" role="alert">{errors.photo}</div>}
          {image && (
            <img
              src={image}
              alt="Preview"
              style={{ width: '100%', borderRadius: 12, marginTop: 12 }}
            />
          )}
          <p className="mute" style={{ marginTop: 8 }}>
            Photo links work immediately. Uploading files requires Cloudinary credentials and supports JPEG, PNG, WebP under 2 MB.
          </p>
        </div>
      </form>
      {errors.submit && <div className="err" role="alert" style={{ marginTop: 12 }}>{errors.submit}</div>}
      <div className="row" style={{ marginTop: 24 }}>
        <button
          className="btn alt"
          disabled={isSubmitting}
          onClick={() => save('Draft')}
        >
          {isSubmitting ? 'Saving…' : 'Save draft'}
        </button>
        <button
          className="btn"
          disabled={isSubmitting}
          onClick={() => save('Active')}
        >
          {isSubmitting ? 'Publishing…' : 'Publish listing'}
        </button>
      </div>
    </>
  );
}
