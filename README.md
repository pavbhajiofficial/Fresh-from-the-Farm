# Fresh from the Farm 🌾

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/Security-Audited%200%20Vulnerabilities-brightgreen?style=flat)](#-security-hardening)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Fair for everyone.** A direct-from-farmers marketplace connecting local agricultural producers and buyers with fair, transparent pricing and no middlemen.

---

## ✨ Features

### 🛒 For Buyers
- **Live Produce Directory**: Filter fresh vegetables, fruits, and greens by category, location, and dynamic price sliders.
- **Search & Sort**: Real-time keyword filtering and sorting (price low-to-high, high-to-low, newest harvest).
- **Cart & Checkout**: Multi-item cart with quantity steppers respecting individual minimum order thresholds and live stock limits.
- **Fulfilment Options**: Toggle seamlessly between doorstep delivery and direct on-farm pickup.
- **Order Tracking**: Review past and current orders with real-time status badges (`Placed`, `Confirmed`, `Preparing`, `Ready`, `Completed`, `Rejected`).

### 🧑‍🌾 For Farmers
- **Merchant Dashboard**: Instant snapshot of total sales revenue, active produce listings, pending orders, and stock levels.
- **Listing Management**: Add new harvests with variety, description, unit price, stock, and photos.
- **Harvest Status Controls**: One-click toggles to publish drafts, mark produce as sold out, or reactivate listings.
- **Order Fulfilment Workflow**: Accept incoming orders, advance fulfillment status (`Confirmed` ➔ `Preparing` ➔ `Ready` ➔ `Completed`), or reject unfulfillable requests.

---

## 🔒 Security Hardening

- **Zero Vulnerabilities**: Upgraded dependencies to patched, secure versions (`0 vulnerabilities` on `npm audit`).
- **HTTP Security Headers**: Enforced in `next.config.mjs`:
  - `Content-Security-Policy` (CSP) restricting scripts, styles, fonts, objects, and connect endpoints.
  - `X-Frame-Options: DENY` (anti-clickjacking).
  - `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy` (disables unnecessary hardware APIs like camera, microphone, geolocation).
  - `X-DNS-Prefetch-Control: on` and `Strict-Transport-Security` (HSTS).
  - Fingerprint suppression with `poweredByHeader: false`.
- **Upload Validation**: File upload in Farmer portal strictly enforces safe raster image MIME types (JPEG, PNG, WebP, GIF, AVIF), disallows executable SVG formats, and caps sizes at 5 MB.
- **Safe Media Handling**: Strict protocol inspection on image URLs to prevent `javascript:` and arbitrary script execution, with automatic fallback placeholders for broken links.
- **Resilient Client Storage**: Input validation and schema assertions on all `localStorage` state to eliminate prototype pollution and corruption.
- **Form Hardening**: Character length limits (`maxLength`), numeric bounds checking, email/phone format validation, and duplicate submission prevention.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Handcrafted responsive CSS (`app/globals.css`) with custom earthy color palette and zero UI bloat
- **Illustrations**: Handcrafted SVG pencil sketches (`components/Sketch.tsx`)

---

## 📁 Directory Structure

```
├── app/
│   ├── layout.tsx             # Root layout, Google Fonts (Gaegu, Inter), metadata & viewport
│   ├── page.tsx               # Homepage with hero search, marquee, sketches & weekly harvests
│   ├── marketplace/page.tsx   # Search, filters, and produce card grid
│   ├── product/[id]/page.tsx  # Product details, stock limits, and buy-now flow
│   ├── cart/page.tsx          # Cart review, delivery options, and order placement
│   ├── orders/page.tsx        # Buyer order history and status tracking
│   ├── auth/page.tsx          # Farmer/Buyer onboarding with form validation
│   ├── farmer/
│   │   ├── layout.tsx         # Dedicated sidebar layout for farmer portal
│   │   ├── page.tsx           # Performance overview and recent orders table
│   │   ├── listings/page.tsx  # Harvest inventory management & status controls
│   │   ├── new/page.tsx       # Secure produce listing creation with photo upload
│   │   └── orders/page.tsx    # Order processing and fulfillment progression
│   ├── robots.ts              # Search engine crawler policies
│   ├── sitemap.ts             # Dynamic search engine sitemap
│   ├── manifest.ts            # Progressive Web App (PWA) manifest
│   └── not-found.tsx          # Themed custom 404 page
├── components/                # Modular UI elements (Header, Footer, Badge, Sketch, Photo, etc.)
├── db/
│   └── schema.sql             # Reference PostgreSQL schema for backend integration
└── lib/
    ├── api.ts                 # Data layer with client-side persistence & input sanitization
    ├── cart.tsx               # Cart state context with cross-tab sync & validation
    ├── format.ts              # INR currency and calculation utilities
    └── types.ts               # Core TypeScript definitions (Product, Order, User, etc.)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `18.18+` or `20+`
- npm `9+`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd fresh-from-the-farm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server on port 3000 |
| `npm run build` | Builds the optimized production application |
| `npm run start` | Starts the production server using the built bundle |
| `npm audit` | Audits dependencies for security vulnerabilities |

---

## 🔌 Backend Integration

The application contains an isolated data layer in `lib/api.ts`. All frontend components communicate exclusively through typed helper methods (`listProducts`, `getProduct`, `addProduct`, `setProductStatus`, `listOrders`, `createOrder`, `setOrderStatus`).

To connect to a live backend API:
1. Refer to the PostgreSQL reference definitions in `db/schema.sql`.
2. Update the asynchronous functions in `lib/api.ts` to execute `fetch()` requests against your backend endpoints.
3. The TypeScript contracts in `lib/types.ts` remain consistent.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
