import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";

// Prefer env vars, fallback to provided values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAZQLOQxbCk7TvlImTFMfW7rgwapH_XYjk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trusty-diorama-475905-c3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trusty-diorama-475905-c3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trusty-diorama-475905-c3.appspot.com",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const idToken = await cred.user.getIdToken();
    return { user: cred.user, idToken };
  } catch (e: any) {
    const message = mapError(e);
    throw new Error(message);
  }
}

export async function handleGoogleRedirect(start?: boolean) {
  try {
    if (start) {
      await signInWithRedirect(auth, googleProvider);
      return null; // Will redirect
    }
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (e: any) {
    const message = mapError(e);
    throw new Error(message);
  }
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export async function signOut() {
  await fbSignOut(auth);
  try { localStorage.clear(); } catch {}
}

export function onAuthStateChange(cb: (user: User | null) => void) {
  return fbOnAuthStateChanged(auth, cb);
}

function mapError(e: any): string {
  const msg = e?.message || String(e);
  if (msg.includes("popup-closed-by-user")) return "Popup was closed before completing sign-in.";
  if (msg.includes("operation-not-allowed")) return "Google sign-in is disabled for this project.";
  if (msg.includes("network-request-failed")) return "Network error. Check your connection and try again.";
  return msg;
}
