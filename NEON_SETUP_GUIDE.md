# Neon Database Setup for EcoRide

## Step 1: Create Neon Account
1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up with GitHub/Google
3. Create a new project: "EcoRide"

## Step 2: Get Connection String
1. Go to Dashboard > Connection Details
2. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-name.region.aws.neon.tech/dbname?sslmode=require
   ```

## Step 3: Update Your .env
```env
DATABASE_URL="postgresql://user:password@ep-name.region.aws.neon.tech/dbname?sslmode=require"
SIMPLE_AUTH=false
```

## Step 4: Initialize Database
```bash
cd EcoRideConnect
npm run db:push
```

## Step 5: Verify Connection
Start your app and check for database connection logs:
```bash
npm run dev
```

Look for: `[db] module init. SIMPLE_AUTH=false DATABASE_URL=SET`

## Free Tier Limits:
- ✅ 512MB storage
- ✅ 100 compute hours/month
- ✅ Unlimited databases
- ✅ 2GB data transfer

Perfect for development and early production! 🎉