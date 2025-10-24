# RideConnect 🚗

Modern ride-hailing platform with a clean TypeScript stack. This guide walks you step-by-step through setup for backend, frontend, database, and credentials (without exposing real secrets).

## 🚀 What's inside
- Backend: Express + TypeScript + Drizzle ORM on Neon PostgreSQL
- Frontend: React 18 + Vite + Tailwind + Radix UI + React Query
- Maps: Google Maps via @vis.gl/react-google-maps
- Auth options:
	- Simple session auth for local and demos
	- Stack Auth JWT verification (via JWKS)
	- Firebase token verification (optional)
- Payments: Stripe (optional)
- CI: PRs can create Neon preview DB branches and run migrations

Live (Codespaces preview): open the forwarded HTTPS URL for cookies
```
https://<your-codespace>-5000.app.github.dev
```

Health: GET `/api/health` → `{ ok: true, mode: "full" | "simple" }`

Tip: Set `VITE_GOOGLE_MAPS_API_KEY` to enable maps in the client.

## 🧱 Project structure
```
EcoRideConnect/
├── client/                 # React app (components, pages, hooks, lib)
├── server/                 # Express server (routes, storage, integrations)
├── shared/                 # Shared types and DB schema (drizzle)
├── migrations/             # Drizzle SQL migrations
└── dist/                   # Build output
```

## ✅ Step-by-step setup (recommended path)

1) Prerequisites

2) Clone and install
```bash
git clone https://github.com/sidhu90989/Echo-Ride.git
cd Echo-Ride/EcoRideConnect
npm install
```

 - Maps: Google Maps via @vis.gl/react-google-maps
 

- Quick demo (memory mode)
 # VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
	- Use session-based simple auth and in-memory storage
```env
# Quick demo defaults
SIMPLE_AUTH=true
VITE_SIMPLE_AUTH=true
SESSION_SECRET=dev-session-secret
# If running behind a proxy (Codespaces/Render), keep cookies secure
COOKIE_SECURE=true
# Optional: set API base if serving frontend separately
# VITE_API_URL=https://your-domain
```

- Full DB mode (recommended)
	- Real Neon DB, server verifies tokens (Stack Auth or Firebase) OR use hybrid local session
```env
# Core
SIMPLE_AUTH=false
DATABASE_URL=postgresql://user:password@ep-host.region.aws.neon.tech/dbname?sslmode=require
SESSION_SECRET=please-change-me

# Hybrid local auth (keep true while you’re still using session login locally)
ALLOW_SIMPLE_AUTH_ROUTES=true
VITE_SIMPLE_AUTH=true

# Cookies behind HTTPS proxy (Codespaces/Render)
COOKIE_SECURE=true

# CORS if serving frontend from a separate origin (e.g., Vercel)
# FRONTEND_ORIGIN=https://your-frontend.example.com

# Maps
# VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Stripe (optional)
# STRIPE_SECRET_KEY=sk_live_or_test
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_or_test

# Stack Auth (optional; enables JWT verification via JWKS)
# STACK_PROJECT_ID=your-stack-project-id
# STACK_JWKS_URL=https://api.stack-auth.com/api/v1/projects/<STACK_PROJECT_ID>/.well-known/jwks.json

# Firebase (optional; token verification)
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_PROJECT_ID=...
# VITE_FIREBASE_APP_ID=...

# Server-side external API example
# NAME_API_BASE_URL_DEV=https://api.example.dev
# NAME_API_TOKEN_DEV=dev-token
# NAME_API_BASE_URL_PROD=https://api.example.com
# NAME_API_TOKEN_PROD=prod-token
```

4) Initialize the database
```bash
npm run db:push
```

5) Seed demo data (drivers, users, badges)
```bash
npm run seed
```

6) Run the app
```bash
npm run dev
# Open: https://<your-codespace>-5000.app.github.dev
```

7) Login flow (local)
- With simple auth enabled (VITE_SIMPLE_AUTH=true):
	1. Click Continue → Complete Your Profile
	2. Choose role (rider/driver) and submit
	3. You’ll be redirected to the appropriate dashboard

- When you’re ready to switch to token-based login (Stack Auth or Firebase):
	- Disable the simple session UI by setting `VITE_SIMPLE_AUTH=false` and removing `ALLOW_SIMPLE_AUTH_ROUTES`
	- Send `Authorization: Bearer <token>` from your client to the server

Security note: never commit real secrets; keep them in environment variables or provider dashboards.

## 🔑 Environment variable reference

Common/server
- DATABASE_URL: Postgres connection (Neon recommended)
- SESSION_SECRET: session signing secret for local session flows
- SIMPLE_AUTH: true = in-memory + session login; false = database mode
- ALLOW_SIMPLE_AUTH_ROUTES: allow session endpoints even when SIMPLE_AUTH=false (hybrid dev)
- COOKIE_SECURE: set true behind HTTPS proxies (Codespaces/Render)
- FRONTEND_ORIGIN: comma-separated list of allowed origins for CORS
- STRIPE_SECRET_KEY: Stripe server key (optional)
- STACK_PROJECT_ID: Stack Auth project id (optional)
- STACK_JWKS_URL: JWKS URL; auto-derived from STACK_PROJECT_ID if omitted
- NAME_API_BASE_URL_DEV/PROD, NAME_API_TOKEN_DEV/PROD: server-only external API config

Client (Vite)
- VITE_SIMPLE_AUTH: show simple session UI in dev
- VITE_API_URL: set if API is on a different origin; empty means same origin
- VITE_GOOGLE_MAPS_API_KEY: Maps JavaScript key (optional)
- VITE_STRIPE_PUBLISHABLE_KEY: Stripe publishable key (optional)
- VITE_FIREBASE_*: only needed for a Firebase-based client flow

All `.env*` files are git-ignored.

## 🗄️ Database (Neon)
- Driver: `@neondatabase/serverless` with Drizzle ORM
- Config: `EcoRideConnect/server/db.ts`, schema at `EcoRideConnect/shared/schema.ts`
- Init & migrate: `npm run db:push`
- Seed: `npm run seed`

For more Neon and CI details, see `NEON_SETUP_GUIDE.md`.

## ▶️ Local API quick checks
```bash
# Health
curl -s https://<codespace>-5000.app.github.dev/api/health

# List available drivers (requires auth; simple session or Bearer token)
curl -s --cookie "connect.sid=<your-session-cookie>" \
	https://<codespace>-5000.app.github.dev/api/rider/available-drivers
```

Key API endpoints
- GET /api/health
- POST /api/auth/login  (simple session; local only)
- POST /api/auth/logout (simple session; local only)
- POST /api/auth/complete-profile (token or session)
- GET  /api/rider/available-drivers (rider only)
- POST /api/rides (rider only)
- POST /api/rides/:id/accept (driver only)
- PUT  /api/driver/availability (driver only)

## 🚀 Deploy to Render
- File: `render.yaml` provisions a single web service under `EcoRideConnect`
- Default deploy runs in memory mode (SIMPLE_AUTH=true) to avoid DB dependency
- To enable full DB mode on Render set:
	- SIMPLE_AUTH=false
	- DATABASE_URL=… (Neon pooled URL)
	- COOKIE_SECURE=true (already set)
	- Optionally STACK_* or Firebase envs

Build command (Render):
- `npm ci --include=dev` then `VITE_BASE_PATH=/ npm run build`

Start command (Render):
- `npm run start:migrate` (runs Drizzle migrations then starts server)

## 🛠️ CI / PR preview databases
- Workflow: `.github/workflows/neon-preview.yml`
	- On PR open/sync: creates Neon branch `preview/pr-<number>-<branch>` and runs migrations
- Repo secrets/vars required:
	- `NEON_API_KEY` (secret), `NEON_PROJECT_ID` (variable)
	- Optional Vercel: `VERCEL_TOKEN` (secret), `VERCEL_PROJECT_ID` (variable)

## 📦 Build locally
```bash
npm run build
```
Output: `EcoRideConnect/dist/public/` (client) and `EcoRideConnect/dist/index.js` (server bundle).

## 📚 More docs
- API quick setup: `API_SETUP_GUIDE.md`
- Neon setup details: `NEON_SETUP_GUIDE.md`
- Development notes: `DEVELOPMENT.md`

---
Made with 💚 for a sustainable future