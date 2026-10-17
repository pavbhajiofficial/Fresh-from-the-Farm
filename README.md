# Fresh from the Farm 🌾

> **Fair for everyone.** A direct-from-farmers marketplace connecting local growers and buyers with fair and transparent pricing.

Built with **Next.js (App Router)**, **React**, and **TypeScript**. Styled with handcrafted, responsive CSS in `app/globals.css` with zero third-party UI library bloat.

---

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Project Architecture

```
├── app/
│   ├── layout.tsx         # Root layout (Google Fonts, metadata, viewport, CartProvider)
│   ├── page.tsx           # Landing page with hero search, sketches & featured harvests
│   ├── marketplace/       # Marketplace directory with search, categories, and price filters
│   ├── product/[id]/      # Detailed product view & quantity selection
│   ├── cart/              # Cart, delivery/pickup selection & checkout flow
│   ├── orders/            # Buyer orders list & status badges
│   ├── auth/              # Role-based join form (Farmer / Buyer)
│   ├── farmer/            # Farmer portal (Dashboard, listings, add produce, manage orders)
│   ├── robots.ts          # Search engine crawler configuration
│   ├── sitemap.ts         # Dynamic sitemap generator
│   ├── manifest.ts        # PWA web manifest
│   └── not-found.tsx      # Themed 404 page
├── components/            # Reusable UI components (Header, Footer, Sketch, ProductCard, etc.)
├── db/
│   └── schema.sql         # PostgreSQL schema matching data models
└── lib/
    ├── api.ts             # Data layer with client-side state persistence & validation
    ├── cart.tsx           # Cart context with localStorage sync & cross-tab coordination
    ├── format.ts          # INR currency and total calculation helpers
    └── types.ts           # TypeScript interfaces for products, orders, and users
```

---

## 🔒 Security Hardening

- **Content Security Policy (CSP)** & strict HTTP headers configured in `next.config.mjs` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS).
- **Zero Known Vulnerabilities**: Audited and clean dependency tree (`0 vulnerabilities`).
- **File Upload Protection**: Enforces strict image MIME types (disallowing SVG script execution) and caps file sizes to 5 MB to prevent browser DoS.
- **Safe Image Rendering**: Validates URL protocols (`https:`, `http:`, or sanitized base64 raster images) to prevent `javascript:` and arbitrary script execution.
- **Client Storage Resilience**: Validates and sanitizes stored data from `localStorage` to guard against prototype poisoning or corrupted state.
- **Form Input Sanitization**: Client-side field trimming, length limits (`maxLength`), numeric bounds validation, and prevention of duplicate submissions.

---

## 🛠️ Scripts

- `npm run dev`: Runs the development server on port 3000.
- `npm run build`: Builds an optimized production bundle.
- `npm run start`: Runs the built production application.
- `npm run lint`: Checks for linting issues.

---

## 📄 License

MIT
