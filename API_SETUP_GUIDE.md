# EcoRide API Setup Guide

## 🚀 **IMMEDIATE SETUP (Start Here)**

### Step 1: Database (CRITICAL)
1. Go to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com)
2. Create a free PostgreSQL database
3. Copy the connection string
4. Add to .env: `DATABASE_URL="your-connection-string"`

### Step 2: Google Maps (CRITICAL)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API  
   - Directions API
   - Geocoding API
4. Create credentials (API Key)
5. Add to .env: `VITE_GOOGLE_MAPS_API_KEY="your-api-key"`

### Step 3: Firebase Authentication (CRITICAL)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication > Sign-in method > Email/Password
4. Get configuration from Project Settings
5. Add to .env:
   ```
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   ```

### Step 4: Stripe Payments (CRITICAL)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account and verify
3. Get API keys from Developers > API keys
4. Add to .env:
   ```
   STRIPE_SECRET_KEY="sk_test_your-secret-key"
   VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your-publishable-key"
   ```

---

## 📱 **PHASE 2: ENHANCED FEATURES**

### Step 5: SMS Notifications (IMPORTANT)
1. Go to [Twilio Console](https://console.twilio.com)
2. Get a phone number and API credentials
3. Add to .env:
   ```
   TWILIO_ACCOUNT_SID="your-sid"
   TWILIO_AUTH_TOKEN="your-token"
   TWILIO_PHONE_NUMBER="your-phone"
   ```

### Step 6: Email Service (IMPORTANT)
1. Go to [SendGrid](https://sendgrid.com) or [Mailgun](https://mailgun.com)
2. Get API key
3. Add to .env: `SENDGRID_API_KEY="your-key"`

---

## 🌟 **PHASE 3: ADVANCED FEATURES**

### Step 7: Weather Integration
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Get free API key
3. Add to .env: `OPENWEATHER_API_KEY="your-key"`

### Step 8: Carbon Footprint
1. Go to [Climatiq](https://climatiq.io)
2. Get API key for carbon calculations
3. Add to .env: `CLIMATIQ_API_KEY="your-key"`

---

## 💰 **COST BREAKDOWN (Monthly)**

### Free Tier Limits:
- **Google Maps**: 28,000 map loads/month (FREE)
- **Firebase**: 50,000 reads, 20,000 writes/day (FREE)
- **Stripe**: No monthly fee, 2.9% + 30¢ per transaction
- **Neon/Supabase**: 512MB database (FREE)
- **Twilio**: $15/month for phone number + $0.0075/SMS
- **SendGrid**: 100 emails/day (FREE)

### Expected Monthly Cost for Startup: $15-30/month

---

## ⚡ **QUICK START COMMAND**

After setting up APIs, run:
```bash
cd EcoRideConnect
cp .env.example .env
# Edit .env with your API keys
npm install
npm run db:push
npm run dev
```

---

## 🔍 **API Testing Checklist**

- [ ] Database connects successfully
- [ ] Google Maps loads on homepage
- [ ] Firebase authentication works
- [ ] Stripe payment form appears
- [ ] SMS/Email notifications send
- [ ] Real-time ride updates work

---

## 🆘 **NEED HELP?**

1. Check our [Development Guide](DEVELOPMENT.md)
2. Review error logs: `npm run dev`
3. Test APIs individually in browser developer tools
4. Join our community for support

**Priority:** Start with Steps 1-4 first, then add others as needed!