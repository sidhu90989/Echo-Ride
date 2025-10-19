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

---

## Neon API Details (for CI & Preview Databases)

These credentials let CI and automation create Neon preview branches and run migrations.

### 1) Generate a Neon API Key
1. Profile (top-right) → Account Settings → API Keys
2. Click “+ New API Key”, name it (e.g., EcoRide-Prod-Key)
3. Copy the key (looks like `ne_api_...`) and keep it secret

### 2) Find Your Project ID
- Open your project in the Neon console and copy it from the URL:
   `https://console.neon.tech/app/projects/<YOUR_PROJECT_ID>`

### 3) Add to Environment
Set in GitHub repository (Settings → Secrets and variables):

```env
NEON_API_KEY=ne_api_1s02p9bxKLC...s1JKq9
NEON_PROJECT_ID=fuzzy-sun-12345678
DATABASE_URL=postgresql://user:password@ep-host.aws.neon.tech/neondb?sslmode=require
```

### 4) Useful API calls
List branches:
```bash
curl -X GET \
   -H "Authorization: Bearer $NEON_API_KEY" \
   "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches"
```

Create a preview branch:
```bash
curl -X POST \
   -H "Authorization: Bearer $NEON_API_KEY" \
   -H "Content-Type: application/json" \
   -d '{"branch": {"name": "preview-test"}}' \
   "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches"
```

### 5) Render integration
- On Render, set `DATABASE_URL` in your service Environment.
- Our Render start command runs Drizzle migrations automatically (`start:migrate`).