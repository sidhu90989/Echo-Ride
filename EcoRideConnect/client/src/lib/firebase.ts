import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
  signOut as fbSignOut,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber as fbSignInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged as fbOnAuthStateChanged,
} from "firebase/auth";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let recaptcha: RecaptchaVerifier | undefined;

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
  const fallbackProjectId = "trusty-diorama-475905-c3";
  const fallbackStorageBucket = "trusty-diorama-475905-c3.appspot.com";

  // Build a minimal config sufficient for Auth; include optional fields if available
  const firebaseConfig: Record<string, string> = {
    apiKey,
    ...(explicitAuthDomain
      ? { authDomain: explicitAuthDomain }
      : projectId
      ? { authDomain: `${projectId}.firebaseapp.com` }
      : { authDomain: fallbackAuthDomain }),
    ...(projectId ? { projectId } : { projectId: fallbackProjectId }),
    ...(storageBucket
      ? { storageBucket }
      : { storageBucket: fallbackStorageBucket }),
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

// Friendly error mapping
function mapFirebaseError(e: any): string {
  const msg = e?.message || String(e);
  if (msg.includes("auth/invalid-phone-number")) return "Invalid phone number format.";
  if (msg.includes("auth/too-many-requests")) return "Too many attempts. Please try again later.";
  if (msg.includes("auth/invalid-verification-code")) return "Incorrect OTP. Please try again.";
  if (msg.includes("auth/missing-verification-code")) return "Please enter the OTP.";
  return msg;
}

// Ensure recaptcha verifier (visible or invisible)
export function ensureRecaptcha(
  containerId = "recaptcha-container",
  options?: { size?: 'invisible' | 'normal' | 'compact'; theme?: 'light' | 'dark' }
) {
  if (!auth) throw new Error("Firebase auth not initialized");
  if (recaptcha) return recaptcha;
  const container = document.getElementById(containerId) || (() => {
    const div = document.createElement("div");
    div.id = containerId;
    div.style.position = "fixed";
    div.style.bottom = "-9999px";
    document.body.appendChild(div);
    return div;
  })();
  recaptcha = new RecaptchaVerifier(auth, container, { size: options?.size || "invisible", theme: options?.theme });
  return recaptcha;
}

export function refreshRecaptcha(
  containerId = "recaptcha-container",
  options?: { size?: 'invisible' | 'normal' | 'compact'; theme?: 'light' | 'dark' }
) {
  try {
    if (recaptcha) {
      recaptcha.clear();
      recaptcha = undefined;
    }
  } catch {}
  return ensureRecaptcha(containerId, options);
}

export async function signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult> {
  if (!auth) throw new Error("Firebase auth not initialized");
  let attempt = 0;
  while (true) {
    const verifier = attempt === 0
      ? ensureRecaptcha("recaptcha-container", { size: 'normal', theme: 'light' })
      : refreshRecaptcha("recaptcha-container", { size: 'normal', theme: 'light' });
    try {
      return await fbSignInWithPhoneNumber(auth, phoneNumber, verifier);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("auth/too-many-requests") && attempt < 2) {
        attempt++;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw new Error(mapFirebaseError(e));
    }
  }
}

export async function confirmOTP(confirmation: ConfirmationResult, otp: string) {
  try {
    return await confirmation.confirm(otp);
  } catch (e) {
    throw new Error(mapFirebaseError(e));
  }
}

export async function signOut() {
  if (!auth) return;
  await fbSignOut(auth);
}

export function onAuthStateChanged(cb: Parameters<typeof fbOnAuthStateChanged>[1]) {
  if (!auth) return () => {};
  return fbOnAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
  if (!auth || !googleProvider) throw new Error("Firebase auth not initialized");
  return await signInWithPopup(auth, googleProvider);
}
