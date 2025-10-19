# EcoRide Connect 🌱🚗

A sustainable rideshare platform that connects eco-conscious drivers and riders, promoting environmental responsibility through shared transportation.

## Features

- **Eco-Friendly Focus**: Prioritizes electric vehicles and hybrid cars
- **Real-time Matching**: Connect drivers and riders instantly
- **Environmental Impact Tracking**: Monitor your carbon footprint reduction
- **Secure Payments**: Integrated payment processing with Stripe
- **Admin Dashboard**: Comprehensive management tools
- **Real-time Chat**: In-app messaging between drivers and riders

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching
- **Wouter** for routing
- **Firebase** for authentication

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **WebSocket** for real-time features
- **Passport.js** for authentication
- **Stripe** for payments

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Firebase project
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sidhu90989/Echo-Ride.git
cd Echo-Ride/EcoRideConnect
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
- Database connection string
- Firebase configuration
- Stripe keys
- Session secret

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment

This project is automatically deployed to GitHub Pages when changes are pushed to the main branch.

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. The built files will be in the `dist` directory

### Environment Variables for Production

Make sure to set up the following environment variables in your production environment:

```
DATABASE_URL=your_postgres_connection_string
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
SESSION_SECRET=your_session_secret
```

## Project Structure

```
EcoRideConnect/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript type definitions
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── db.ts              # Database configuration
│   └── seed.ts            # Database seeding
├── shared/                 # Shared types and schemas
├── migrations/             # Database migrations
└── dist/                   # Built application
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact [your-email@example.com] or open an issue on GitHub.

---

Made with 💚 for a sustainable future