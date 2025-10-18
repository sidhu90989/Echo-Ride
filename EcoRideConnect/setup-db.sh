#!/bin/bash
set -e

echo "🚀 Setting up EcoRide Database"
echo "=============================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your DATABASE_URL"
    echo ""
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment"
    echo ""
    echo "💡 Quick Setup Options:"
    echo ""
    echo "1️⃣  Local Development (SIMPLE_AUTH mode):"
    echo "   - Set SIMPLE_AUTH=true in .env"
    echo "   - No database required, uses in-memory storage"
    echo ""
    echo "2️⃣  Production Database Setup:"
    echo "   - Get a free PostgreSQL database from:"
    echo "     • Neon: https://neon.tech/ (Recommended)"
    echo "     • Supabase: https://supabase.com/"
    echo "     • Railway: https://railway.app/"
    echo "   - Add DATABASE_URL to .env file"
    echo "   - Run this script again"
    echo ""
    echo "3️⃣  Local PostgreSQL:"
    echo "   - Install PostgreSQL locally"
    echo "   - Create database: createdb ecoride"
    echo "   - Set DATABASE_URL=postgresql://postgres:password@localhost:5432/ecoride"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL found"
echo "🔗 Database: $DATABASE_URL"
echo ""

# Run migrations
echo "📊 Running database migrations..."
npx drizzle-kit push

echo ""
echo "🌱 Seeding database with initial data..."
tsx server/seed.ts

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🎉 You can now run your app with:"
echo "   npm run dev"
echo ""
echo "📊 Demo accounts created:"
echo "   • Rider: rider@demo.com"
echo "   • Driver: driver@demo.com" 
echo "   • Admin: admin@demo.com"
echo ""