# EcoRide Connect 🌱🚗

Eco-friendly ridesharing platform connecting riders and drivers with a clean, fast TypeScript stack. This README tracks the current progress, APIs in use, and how to run everything.

## 🚀 Current Status (short)
- Backend: Express + TypeScript, Drizzle ORM on Neon PostgreSQL (full DB mode)
- Frontend: React 18 + Vite + Tailwind + Radix UI + React Query
- Maps: Google Maps via @vis.gl/react-google-maps
- Auth (dev): Simple session auth enabled for local; Firebase path available for prod
- Payments: Stripe wired (keys via env)
- CI: PR creates Neon preview DB branch and runs migrations (optional Vercel preview env DATABASE_URL)

Live (Codespaces preview): use the forwarded HTTPS URL to ensure cookies
```
https://<your-codespace>-5000.app.github.dev
```

Health check: `/api/health` → `{ ok: true, mode: "full" }`

## 🧱 Project Structure
```
EcoRideConnect/
├── client/                 # React app (components, pages, hooks, lib)
├── server/                 # Express server (routes, storage, integrations)
├── shared/                 # Shared types and DB schema (drizzle)
├── migrations/             # Drizzle SQL migrations
└── dist/                   # Build output
```

## 🔑 Environment (what you need)
Copy and fill `.env` from `.env.example` in `EcoRideConnect/`.

Required for dev/full DB mode:
- `DATABASE_URL` (Neon PostgreSQL, pooled URL recommended)
- `SESSION_SECRET` (any random string)
- `VITE_SIMPLE_AUTH=true` (enables simple session flow in dev UI)

Recommended/Feature APIs:
- Google Maps: `VITE_GOOGLE_MAPS_API_KEY`
- Firebase Auth (prod): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- Stripe: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`
- External Name API (server-only):
	- `NAME_API_BASE_URL_DEV`, `NAME_API_TOKEN_DEV`
	- `NAME_API_BASE_URL_PROD`, `NAME_API_TOKEN_PROD`

All `.env*` files are git-ignored repo-wide.

## 🗄️ Database (Neon)
- Driver: `@neondatabase/serverless` with Drizzle ORM
- Config: `server/db.ts`, schema at `shared/schema.ts`
- Initialize/Sync schema:
```bash
cd EcoRideConnect
npm run db:push
```

## ▶️ Run locally
```bash
cd EcoRideConnect
npm install
cp .env.example .env   # then edit values
npm run dev
# Open: https://<codespace>-5000.app.github.dev
```

Dev login flow (no Firebase):
1) Click Continue → Complete Your Profile
2) Submit → profile is created in Neon and redirected by role

## 🔗 APIs in use (summary)
- Database: Neon PostgreSQL (serverless), Drizzle ORM
- Maps: Google Maps (vis.gl wrapper)
- Auth: Simple session (dev), optional Firebase for prod
- Payments: Stripe
- External: “Name API” wired server-side with Bearer token (no client exposure)

## 🛠️ CI / PR Preview DB
- Workflow: `.github/workflows/neon-preview.yml`
	- On PR open/sync: creates Neon branch `preview/pr-<number>-<branch>` and runs migrations
	- Optional: sets Vercel Preview env `DATABASE_URL` for that git branch
- Required repo secrets/vars:
	- `NEON_API_KEY` (secret), `NEON_PROJECT_ID` (variable)
	- Optional Vercel: `VERCEL_TOKEN` (secret), `VERCEL_PROJECT_ID` (variable)

## 📦 Build
```bash
cd EcoRideConnect
npm run build
```
Build output in `EcoRideConnect/dist/public/` (Vite client) + `EcoRideConnect/dist/index.js` (server bundle).

For Neon API keys/Project ID and CI integration, see `NEON_SETUP_GUIDE.md`.

## 🧪 Quick API checks
```bash
# Health
curl -s https://<codespace>-5000.app.github.dev/api/health

# External Name API test (server-side only; requires NAME_API_* envs)
curl -s https://<codespace>-5000.app.github.dev/api/integrations/name-api/whoami
```

## 🤝 Contributing
1) Branch: `git checkout -b feat/<name>`
2) Commit: `git commit -m "feat: ..."`
3) Push/PR: `git push -u origin feat/<name>`

---
Made with 💚 for a sustainable future