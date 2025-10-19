import { withApiBase } from "./apiBase";
// API Configuration Validator
// Use this to test if your APIs are configured correctly

export class APIValidator {
  static async validateGoogleMaps(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  static validateFirebase(): boolean {
    const requiredEnvs = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID', 
      'VITE_FIREBASE_APP_ID'
    ];
    
    return requiredEnvs.every(env => {
      const value = import.meta.env[env];
      return value && value !== 'mock-firebase-api-key' && value !== 'your-firebase-api-key';
    });
  }

  static validateStripe(): boolean {
    const requiredEnvs = [
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ];
    
    return requiredEnvs.every(env => {
      const value = import.meta.env[env];
      return value && value !== 'pk_test_mock_development_key' && value !== 'pk_test_your_stripe_publishable_key';
    });
  }

  static async validateDatabase(): Promise<boolean> {
    try {
  const response = await fetch(withApiBase('/api/health'));
      return response.ok;
    } catch {
      return false;
    }
  }

  static async runAllValidations() {
    const results = {
      googleMaps: false,
      firebase: false,
      stripe: false,
      database: false
    };

    // Validate Google Maps
    const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (mapsKey && mapsKey !== 'mock-google-maps-api-key') {
      results.googleMaps = await this.validateGoogleMaps(mapsKey);
    }

    // Validate Firebase
    results.firebase = this.validateFirebase();

    // Validate Stripe
    results.stripe = this.validateStripe();

    // Validate Database
    results.database = await this.validateDatabase();

    return results;
  }

  static getSetupInstructions() {
    return {
      googleMaps: {
        name: "Google Maps API",
        priority: "CRITICAL",
        setup: "https://console.cloud.google.com/apis/credentials",
        cost: "Free tier: 28,000 map loads/month"
      },
      firebase: {
        name: "Firebase Authentication", 
        priority: "CRITICAL",
        setup: "https://console.firebase.google.com/",
        cost: "Free tier: 50k reads, 20k writes/day"
      },
      stripe: {
        name: "Stripe Payments",
        priority: "CRITICAL", 
        setup: "https://dashboard.stripe.com/apikeys",
        cost: "2.9% + 30¢ per transaction"
      },
      database: {
        name: "PostgreSQL Database",
        priority: "CRITICAL",
        setup: "https://neon.tech/ or https://supabase.com/",
        cost: "Free tier: 512MB database"
      }
    };
  }
}

// Auto-run validation in development
if (import.meta.env.DEV) {
  APIValidator.runAllValidations().then(results => {
    console.group('🔧 API Configuration Status');
    
    Object.entries(results).forEach(([api, isValid]) => {
      const status = isValid ? '✅' : '❌';
      const instructions = APIValidator.getSetupInstructions()[api as keyof typeof results];
      
      console.log(`${status} ${instructions.name} - ${instructions.priority}`);
      if (!isValid) {
        console.log(`   Setup: ${instructions.setup}`);
        console.log(`   Cost: ${instructions.cost}`);
      }
    });
    
    const validCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.values(results).length;
    
    console.log(`\n📊 APIs Configured: ${validCount}/${totalCount}`);
    
    if (validCount < totalCount) {
      console.log('\n📋 Next Steps:');
      console.log('1. Check API_SETUP_GUIDE.md for detailed instructions');
      console.log('2. Update your .env file with real API keys');  
      console.log('3. Restart the development server');
    }
    
    console.groupEnd();
  });
}