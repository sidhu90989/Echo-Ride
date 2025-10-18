# EcoRide - Eco-Friendly Ride Sharing Platform

## Overview
EcoRide is a comprehensive ride-sharing platform focused on eco-friendly transportation using E-Rickshaws, E-Scooters, and CNG Cars. The platform includes three role-based modules: Rider App, Driver App, and Admin Dashboard.

## Project Architecture

### Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon)
- **Authentication**: Firebase Auth (Google Sign-In)
- **Payments**: Stripe
- **Real-time**: WebSockets for live tracking
- **State Management**: TanStack Query (React Query)

### Color Theme
- **Primary**: Forest Green `142 71% 45%` - Brand color, CTAs
- **Dark Accent**: Deep Charcoal `210 11% 15%` - Headers, text
- **Light Accent**: Mint Fresh `152 61% 91%` - Backgrounds, success states
- **Alert**: Red `0 84% 60%` - SOS button, errors
- **Info**: Sky Blue `199 89% 48%` - Informational messages

## Key Features Implemented (MVP)

### Rider App
- Google sign-in authentication
- Interactive booking interface with vehicle selection (E-Rickshaw, E-Scooter, CNG Car)
- Female driver preference toggle
- Eco-impact tracking (CO₂ saved, eco-points, badges)
- Ride history
- Rewards and referral system
- Responsive design for mobile and desktop

### Driver App
- Driver dashboard with earnings overview
- Online/offline availability toggle
- Ride request acceptance system
- Female rider preference option
- KYC status tracking
- Ride history and earnings tracking

### Admin Dashboard
- Platform-wide analytics (users, drivers, revenue, CO₂ saved)
- Active ride monitoring
- User and driver management
- Vehicle distribution statistics
- Real-time active rides view

## Database Schema

### Core Tables
- **users**: User profiles (riders, drivers, admins)
- **driver_profiles**: Driver-specific data (vehicle, KYC, ratings)
- **rides**: Ride bookings and tracking
- **payments**: Payment transactions
- **ratings**: Ride ratings and feedback
- **eco_badges**: Gamification badges
- **user_badges**: User badge achievements
- **referrals**: Referral tracking

### Key Relationships
- Users have optional driver profiles
- Rides connect riders and drivers
- Payments link to rides
- Ratings link riders and drivers
- Users earn badges through eco-points

## API Endpoints Structure (To Be Implemented)

### Authentication
- `POST /api/auth/verify` - Verify Firebase token
- `POST /api/auth/complete-profile` - Complete user profile after sign-in

### Rider APIs
- `GET /api/rider/stats` - Get rider statistics
- `GET /api/rider/rides` - Get ride history
- `GET /api/rider/badges` - Get earned badges
- `POST /api/rides` - Request a new ride

### Driver APIs
- `GET /api/driver/stats` - Get driver statistics
- `GET /api/driver/pending-rides` - Get pending ride requests
- `PUT /api/driver/availability` - Update online/offline status
- `POST /api/rides/:id/accept` - Accept a ride request

### Admin APIs
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/active-rides` - Currently active rides
- `GET /api/admin/users` - User management
- `GET /api/admin/drivers` - Driver management

### Payment APIs
- `POST /api/create-payment-intent` - Create Stripe payment intent

## Environment Variables
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `DATABASE_URL` - PostgreSQL connection string
 - `SIMPLE_AUTH` - when `true`, enables session-based local auth (no Firebase/Stripe required)

## Recent Changes (Task 1 - Schema & Frontend)
- ✅ Defined complete database schema with 8 core tables and relations
- ✅ Configured green/black eco-theme in tailwind.config.ts
- ✅ Created Firebase authentication integration
- ✅ Built comprehensive UI components (VehicleCard, EcoImpactCard, RideCard)
- ✅ Implemented Rider Dashboard with booking flow
- ✅ Implemented Driver Dashboard with ride request system
- ✅ Implemented Admin Dashboard with analytics
- ✅ Added theme toggle (light/dark mode)
- ✅ Created reusable loading states and error handling components
- ✅ Responsive design for mobile and desktop
- ✅ Role-based routing and authentication

## User Preferences
- Green and black color scheme (eco + tech aesthetic)
- Smooth animations and transitions
- Mobile-first responsive design
- Accessibility with proper ARIA labels and data-testid attributes

## Next Steps
1. Implement backend API endpoints with Express
2. Set up PostgreSQL database with Drizzle ORM
3. Integrate WebSocket for real-time ride tracking
4. Connect frontend to backend APIs
5. Add payment processing with Stripe
6. Implement comprehensive error handling and validation
7. End-to-end testing of core user journeys
