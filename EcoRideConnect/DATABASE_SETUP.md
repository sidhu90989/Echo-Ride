# EcoRide Database Setup

This guide will help you set up the database for your EcoRide application.

## Quick Start

### Option 1: Development Mode (No Database Required)
For local development and testing:

```bash
# Set SIMPLE_AUTH mode in .env
SIMPLE_AUTH=true
VITE_SIMPLE_AUTH=true

# Start the app
npm run dev
```

This uses in-memory storage - perfect for development and demos.

### Option 2: Production Database Setup

1. **Get a free PostgreSQL database:**
   - **Neon** (Recommended): https://neon.tech/
   - **Supabase**: https://supabase.com/
   - **Railway**: https://railway.app/

2. **Configure environment:**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env and add your database URL
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   ```

3. **Run setup script:**
   ```bash
   ./setup-db.sh
   ```

## Manual Database Setup

If you prefer manual setup:

### 1. Generate and Run Migrations
```bash
# Generate migration files
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
```

### 2. Seed Initial Data
```bash
# Run seed script
npx tsx server/seed.ts
```

### 3. Start Application
```bash
npm run dev
```

## Database Schema

The application includes these main tables:

- **users** - User accounts (riders, drivers, admins)
- **driver_profiles** - Driver-specific information and vehicle details
- **rides** - Ride requests and tracking
- **payments** - Payment transactions
- **ratings** - User ratings and feedback
- **eco_badges** - Achievement badges for eco-friendly behavior
- **user_badges** - Badge assignments to users
- **referrals** - Referral tracking

## Demo Data

After seeding, you'll have these demo accounts:

- **Rider**: `rider@demo.com`
- **Driver**: `driver@demo.com`
- **Admin**: `admin@demo.com`

## Environment Variables

Key database-related environment variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# Development Mode (optional)
SIMPLE_AUTH=false          # Use real database
VITE_SIMPLE_AUTH=false     # Use real auth on frontend

# Other required for production
VITE_GOOGLE_MAPS_API_KEY="your-maps-key"
STRIPE_SECRET_KEY="your-stripe-key"
VITE_FIREBASE_API_KEY="your-firebase-key"
```

## Troubleshooting

### Connection Issues
- Ensure DATABASE_URL is correctly formatted
- Check if your database provider requires SSL (add `?sslmode=require`)
- Verify network connectivity to your database

### Migration Issues
- Make sure the database exists before running migrations
- Check that your user has CREATE privileges
- Try running `npx drizzle-kit push` to sync schema

### Development vs Production
- Use `SIMPLE_AUTH=true` for local development
- Use real database for production deployment
- Environment variables must match between client and server

## Support

If you encounter issues:

1. Check the console for error messages
2. Verify your DATABASE_URL format
3. Ensure all required environment variables are set
4. Try the SIMPLE_AUTH mode for local development