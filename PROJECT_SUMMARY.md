# Coupons Management Project Summary

## Overview
- Full-stack coupon lifecycle platform built with Bun, Elysia.js, React, and PostgreSQL.
- Serves two personas: **administrators** manage campaigns/coupons, **staff** validate and redeem coupons at the point of service.
- Monorepo root keeps API, admin dashboard, staff scanner, and shared assets in one place for easier orchestration and deployment.

## System Snapshot

### Tech Highlights
- **Runtime:** Bun drives scripts and the HTTP server.
- **Backend:** Elysia.js (`packages/api/src/index.ts`) + Prisma ORM for PostgreSQL, JWT auth via bcrypt/jsonwebtoken, PDFKit + qrcode for assets.
- **Frontends:** Two Vite/React apps – admin dashboard (`packages/web`) uses React Router, context auth, and html5-qrcode for an embedded scanner; dedicated staff scanner (`packages/client-web`) uses `@yudiel/react-qr-scanner`.
- **Infrastructure:** Local PostgreSQL provisioned via `docker-compose.yml`; production API supervised by PM2 (`ecosystem.config.js`) and reversed-proxied through the bundled `nginx.conf`.

### Monorepo Layout

| Path | Purpose |
| ---- | ------- |
| `packages/api` | Bun/Elysia API with Prisma schema (`prisma/schema.prisma`), route modules (`src/routes`) for auth/campaign/coupon/redemption/dashboard, PDF/QR utilities, and seeding scripts. |
| `packages/web` | Admin UI: campaign CRUD, coupon generation/export, dashboards, and a scanner view guarded by `ProtectedRoute` and `AuthContext`. |
| `packages/client-web` | Streamlined staff-facing scanner that handles login, QR capture, validation, redemption, and confirmation modals. |
| `packages/shared` | Placeholder for cross-app types/constants. |

## Backend Service (`packages/api`)
- **Routing:** `src/index.ts` composes feature routers:
  - `routes/auth.ts` handles register/login/me using bcrypt hashing and JWT issuance.
  - `routes/campaigns.ts` exposes CRUD, stats, and bulk delete.
  - `routes/coupons.ts` covers listing, detail, generation with QR creation (`utils/qrcode.ts`), PDF export (`utils/pdf.ts`), and bulk updates.
  - `routes/redemption.ts` validates coupons (status/date checks) and redeems them transactionally while logging staff usage.
  - `routes/dashboard.ts` returns aggregate stats (total/used coupons, active campaigns).
- **Data Model:** Prisma schema defines `User`, `Campaign`, `Coupon`, and `RedemptionLog` with enums for roles and coupon statuses. Relations enforce cascading deletes so removing a campaign cleans related coupons/logs.
- **Security:** JWT secret + bcrypt rounds configured via `.env`; `verifyToken` guards protected routes. CORS allowlist (admin/staff domains + localhost) is baked into `src/index.ts`.
- **Assets:** Coupon codes derive from timestamp/random fragments; QR images stored inline as data URLs. PDFKit composes one coupon per page, embedding Kanit fonts from `packages/api/fonts`.
- **Seeding:** `prisma/seed.ts` creates admin/staff accounts and a sample campaign, invoked via `bun run db:seed` or `bun run db:setup`.

## Frontend Surfaces
- **Admin Dashboard (`packages/web`):**
  - React Router routes guard views through `ProtectedRoute` and context-driven role checks.
  - Pages: Dashboard listing, campaign create/edit/detail screens, QR scanner (`ScannerPage.tsx`), and statistics view (`SimpleDashboard.tsx`).
  - API layer (`src/lib/api.ts`) attaches JWTs and handles 401 fallbacks.
  - UI flows support campaign selection, bulk deletion, coupon generation/export, and manual QR validation for staff accounts.
- **Staff Scanner (`packages/client-web`):**
  - Minimal navigation: login + scanning surface.
  - `QRScanner.tsx` streams camera input, throttles duplicate scans, calls `/redemption/validate` before `/redemption/redeem`, and displays success/failure modals with auto-advance timers.
  - Shared axios wrapper mirrors admin app behaviour, keeping auth/session logic consistent.

## Data Model & Coupon Lifecycle
- **User:** `ADMIN` controls campaigns; `STAFF` can scan/redeem (see `prisma/schema.prisma`).
- **Campaign:** Holds descriptive metadata, validity window, and a `totalLimit` that caps coupon generation.
- **Coupon:** Unique `code` + base64 QR payload + status (`AVAILABLE`, `USED`, `EXPIRED`) tied to a campaign. Generated via `/coupons/generate` and optionally exported through `/coupons/export-pdf`.
- **RedemptionLog:** Records which staff user redeemed which coupon and when.
- **Lifecycle:** Admin creates campaign → system ensures `totalLimit` not exceeded when generating coupons → coupons distributed (PDF/QR) → staff scans QR, API validates against status/date, redeems, and logs → dashboard/stat endpoints reflect updated counts.

## Operational Workflow
1. **Setup:** Run `bun install`, start PostgreSQL (`bun run db:start` or `docker-compose up -d`), configure `packages/api/.env`, and run `bun run db:setup` to migrate + seed.
2. **Admin Flow:**
   - Login (seeded account: `admin@coupon.com` / `admin123`).
   - Create campaigns with schedule and quota; dashboard uses `_count.coupons` to track issuance progress.
   - Generate coupons (`/coupons/generate`), export as printable PDF, and distribute codes.
   - Monitor stats via `/campaigns/:id/stats` or `/dashboard/stats`.
3. **Staff Flow:**
   - Login (seeded account: `staff@coupon.com` / `staff123`).
   - Use scanner (admin UI or dedicated staff app) to read QR codes or manually enter codes.
   - Client calls `/redemption/validate` then `/redemption/redeem`; responses drive the modal feedback and auto-advance countdown.
   - Redemption history available through `/redemption/history` filtered by user/role.

## Running Locally
- **Prerequisites:** Bun ≥1.0, Docker (optional for PostgreSQL), and Node-compatible toolchain for Vite builds.
- **Common commands (`package.json`):**
  - `bun run dev` – concurrently start API (`http://localhost:3000`), admin web (`http://localhost:5173`), and client web (default Vite port) via workspace scripts.
  - `bun run dev:api` / `bun run dev:web` / `bun --cwd packages/client-web dev` to focus on a single surface.
  - `bun run db:start|db:stop|db:migrate|db:seed|db:setup` to manage the Postgres container and schema.
- **Environment Variables (`packages/api/.env`):**
  - `DATABASE_URL` – Postgres connection string.
  - `JWT_SECRET` – signing key for tokens.
  - `PORT` – API port (defaults to 3000 locally; PM2 config overrides to 3100 in prod).
- **Ports & Proxies:** Both frontends call `/api/...`; in dev `vite.config.ts` proxies to the Bun server, while production traffic hits Nginx, which serves static assets and forwards `/api/` to the PM2-managed API.

## Production & Deployment Notes
- `DEPLOYMENT.md` documents the VPS setup: clone repo, `bun install`, run Prisma deploy, build admin/client apps, copy `nginx.conf`, and start API with `pm2 start ecosystem.config.js`.
- Nginx hosts two static bundles (admin + staff) and a dedicated API domain, all terminating TLS before proxying to the Bun server on port 3100.
- Logs are separated (`logs/api-*.log`) per PM2 config, and HTTPS is required for camera access in production scanners.

## How Requests Flow
1. Frontend obtains JWT via `/auth/login` and stores it in `localStorage`.
2. Axios interceptors automatically append `Authorization: Bearer <token>` and redirect to `/login` on 401.
3. Campaign/coupon CRUD updates PostgreSQL via Prisma; each mutation returns immediate data for UI refreshes.
4. Scanner workflow invokes validation → redemption; the API enforces date/status constraints and logs usage atomically.
5. Dashboard/stat endpoints aggregate counts so the admin UI can display totals, usage bars, and progress metrics without additional computation.

Refer to the root `README.md` for exhaustive installation instructions and API lists, and to `DEPLOYMENT.md` for server-specific commands.
