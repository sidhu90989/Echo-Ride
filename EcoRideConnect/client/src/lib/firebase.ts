import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
  signOut as fbSignOut,
  signInWithPopup,
} from "firebase/auth";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Initialize Firebase using env vars when present, otherwise fall back to provided credentials
(() => {
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ||
    // Fallback: user-provided public web apiKey
    "AIzaSyAZQLOQxbCk7TvlImTFMfW7rgwapH_XYjk";

  // Support either explicit AUTH_DOMAIN or derive from PROJECT_ID
  const explicitAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;

  // If no env auth domain, fall back to user-provided domain
  const fallbackAuthDomain = "trusty-diorama-475905-c3.firebaseapp.com";

  // Build a minimal config sufficient for Auth; include optional fields if available
  const firebaseConfig: Record<string, string> = {
    apiKey,
    ...(explicitAuthDomain
      ? { authDomain: explicitAuthDomain }
      : projectId
      ? { authDomain: `${projectId}.firebaseapp.com` }
      : { authDomain: fallbackAuthDomain }),
    ...(projectId ? { projectId } : {}),
    ...(storageBucket
      ? { storageBucket }
      : projectId
      ? { storageBucket: `${projectId}.firebasestorage.app` }
      : {}),
    ...(appId ? { appId } : {}),
  };

  // Initialize even if only apiKey + authDomain are present (enough for Auth flows)
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) return;

  app = initializeApp(firebaseConfig as any);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  // Configure common Google provider options
  try {
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch {}
})();

export { app, auth, googleProvider };

export async function signOut() {
  if (!auth) return;
  await fbSignOut(auth);
}

export async function signInWithGoogle() {
  if (!auth || !googleProvider) throw new Error("Firebase auth not initialized");
  return await signInWithPopup(auth, googleProvider);
}
