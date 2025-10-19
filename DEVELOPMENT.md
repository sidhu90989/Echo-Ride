# Development Guide

## Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/sidhu90989/Echo-Ride.git
cd Echo-Ride/EcoRideConnect
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
npm run db:push
```

4. **Start Development**
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Project Architecture

### Frontend (React + TypeScript)
- **Components**: Reusable UI components in `/client/src/components`
- **Pages**: Route-level components in `/client/src/pages`
- **Hooks**: Custom React hooks in `/client/src/hooks`
- **Contexts**: React context providers in `/client/src/contexts`

### Backend (Express + TypeScript)
- **Server**: Main server logic in `/server`
- **Database**: Drizzle ORM with PostgreSQL
- **Routes**: API endpoints in `/server/routes.ts`

### Shared
- **Schema**: Database schema in `/shared/schema.ts`
- **Types**: Shared TypeScript types

## Key Features to Understand

1. **Authentication**: Firebase Auth integration
2. **Real-time**: WebSocket for live updates
3. **Payments**: Stripe integration
4. **Maps**: Google Maps integration
5. **Database**: PostgreSQL with Drizzle ORM

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Deployment

The app automatically deploys to GitHub Pages when you push to main branch.

**Live Demo**: [https://sidhu90989.github.io/Echo-Ride/](https://sidhu90989.github.io/Echo-Ride/)

### PR Preview Databases (Neon)

Pull Requests automatically create a temporary Neon database branch and run Drizzle migrations via the `neon-preview` workflow.

Setup required (one-time in GitHub repo settings):
- Actions Secret: `NEON_API_KEY` (Neon Console → Settings → API Keys)
- Actions Variable: `NEON_PROJECT_ID` (Project settings → Project ID)

The workflow file is at `.github/workflows/neon-preview.yml` and runs on PR open/sync, then deletes the Neon branch when the PR is closed.