# Fresh from the Farm

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Security Audit](https://img.shields.io/badge/Security-0%20Vulnerabilities-brightgreen?style=flat)](https://github.com/advisories)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Fresh from the Farm is a direct-to-consumer agricultural commerce platform designed to bridge local producers and commercial buyers. The frontend application provides real-time harvest discovery, order management, and inventory controls without intermediaries.

Built with Next.js (App Router), React, and TypeScript. Styled using semantic CSS without third-party design dependencies.

---

## System Capabilities

### Buyer Interface
- **Harvest Catalog**: Query agricultural produce filtered by category, location, and price thresholds.
- **Parametric Search & Sorting**: Real-time keyword filtering and multi-attribute sorting (price ascending/descending, harvest recency).
- **Cart & Procurement**: Multi-item order assembly with minimum order quantity (MOQ) validation and live inventory limits.
- **Logistics Selection**: Dynamic fulfillment assignment supporting farm pickup and regional dispatch.
- **Order Lifecycle Tracking**: Status monitoring across standard order phases (`Placed`, `Confirmed`, `Preparing`, `Ready`, `Completed`, `Rejected`).

### Producer Portal
- **Operational Metrics**: Aggregated metrics covering revenue, active listings, pending orders, and total inventory units.
- **Listing Management**: Creation and cataloging of harvests with grading details, pricing, stock levels, and photographic documentation.
- **Lifecycle Control**: Administrative triggers for draft publication, stock exhaustion marking, and listing reactivation.
- **Fulfillment Operations**: Order review pipeline enabling status progression or structured rejection.

---

## Security Architecture

The client application incorporates defense-in-depth security measures to protect users, prevent client-side script execution, and validate data integrity:

- **Dependency Integrity**: Fully patched dependency baseline with zero reported vulnerabilities on standard audits (`npm audit`).
- **HTTP Security Headers**: Configured via `next.config.mjs`:
  - `Content-Security-Policy`: Restricts script, style, font, connect, and media sources (`object-src 'none'`).
  - `X-Frame-Options: DENY`: Prevents UI redressing and clickjacking.
  - `X-Content-Type-Options: nosniff`: Eliminates MIME-type sniffing vulnerabilities.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer data leakage across external origins.
  - `Permissions-Policy`: Restricts browser hardware APIs (camera, microphone, geolocation).
  - `Strict-Transport-Security`: Mandates HTTPS transport in supported environments.
  - `poweredByHeader: false`: Removes framework signature headers to minimize fingerprinting.
- **Input Validation & Sanitization**:
  - Upload endpoints enforce MIME-type whitelisting (JPEG, PNG, WebP, GIF, AVIF), reject executable SVG files, and limit payloads to 5 MB.
  - Media display enforces URL protocol whitelisting (`http:`, `https:`, safe raster data URIs) with automated fallback handlers for unreachable resources.
  - Form fields enforce length constraints (`maxLength`), numeric boundaries, contact format validation (RFC-compliant email and E.164 phone formats), and idempotent submission guards.
- **Client Storage Hardening**: Local storage access layer applies schema validation against parsed JSON to prevent prototype pollution and corrupt state deserialization.

---

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Core Library**: React 18
- **Typing**: TypeScript 5
- **Styling**: Native CSS3 with CSS variables and responsive grid layouts (`app/globals.css`)
- **Graphics**: Scalable Vector Graphics (SVG) with localized filter definitions (`components/Sketch.tsx`)

---

## Repository Structure

```
├── app/
│   ├── layout.tsx             # Root layout, typography, metadata, and cart provider
│   ├── page.tsx               # Index view with discovery search and product showcases
│   ├── marketplace/page.tsx   # Search, filters, and produce catalog
│   ├── product/[id]/page.tsx  # Product specification and purchase interface
│   ├── cart/page.tsx          # Order aggregation, dispatch selection, and checkout
│   ├── orders/page.tsx        # Order history and fulfillment tracking
│   ├── auth/page.tsx          # Account onboarding with role assignment
│   ├── farmer/
│   │   ├── layout.tsx         # Dedicated administrative portal navigation
│   │   ├── page.tsx           # Operational metrics and recent transaction table
│   │   ├── listings/page.tsx  # Harvest inventory control and listing state management
│   │   ├── new/page.tsx       # Listing creation with photo attachment
│   │   └── orders/page.tsx    # Order review and fulfillment progression
│   ├── robots.ts              # Search engine crawler policies
│   ├── sitemap.ts             # Dynamic sitemap index
│   ├── manifest.ts            # Web application manifest configuration
│   └── not-found.tsx          # Custom 404 error handler
├── components/                # Reusable presentation components
├── db/
│   └── schema.sql             # Reference relational schema (PostgreSQL)
└── lib/
    ├── api.ts                 # Data access abstraction with local persistence
    ├── cart.tsx               # Context provider for shopping state
    ├── format.ts              # Currency formatting and aggregation utilities
    └── types.ts               # TypeScript data models and interfaces
```

---

## Getting Started

### Prerequisites
- Node.js (v18.18.0 or higher recommended)
- npm (v9.0.0 or higher)

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/<organization>/<repository>.git
   cd fresh-from-the-farm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at `http://localhost:3000`.

---

## Build and Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Initializes local Next.js development server on port 3000 |
| `npm run build` | Compiles and optimizes production assets |
| `npm run start` | Serves compiled production build |
| `npm run lint` | Performs static code and type verification |

---

## Backend Integration

The frontend uses an abstraction layer located in `lib/api.ts`. All data mutations and queries route through typed asynchronous functions:

- `listProducts()`
- `getProduct(id)`
- `addProduct(payload)`
- `setProductStatus(id, status)`
- `deleteProduct(id)`
- `listOrders()`
- `createOrder(buyerName, address, items)`
- `setOrderStatus(id, status)`

To integrate with a live REST or GraphQL service:
1. Review the data definitions in `lib/types.ts` and the reference relational schema in `db/schema.sql`.
2. Replace mock storage implementations in `lib/api.ts` with direct API calls (e.g., standard `fetch` requests).
3. The UI components will function without structural changes.

---

## License

This software is distributed under the terms of the [MIT License](LICENSE).
