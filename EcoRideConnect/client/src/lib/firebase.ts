import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber as fbSignInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  signInWithPopup,
} from "firebase/auth";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let recaptcha: RecaptchaVerifier | undefined;

// Always initialize Firebase if env values are present, even in SIMPLE_AUTH mode
(() => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;
  if (!apiKey || !projectId || !appId) return;
  const firebaseConfig = {
    apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: `${projectId}.firebasestorage.app`,
    appId,
  } as const;
  app = initializeApp(firebaseConfig);
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

// Ensure recaptcha verifier (invisible)
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
      // Clear existing verifier and recreate
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
    // Try visible captcha first to reduce invisible threshold/abuse detection issues
    const verifier = attempt === 0
      ? ensureRecaptcha("recaptcha-container", { size: 'normal', theme: 'light' })
      : refreshRecaptcha("recaptcha-container", { size: 'normal', theme: 'light' });
    try {
      return await fbSignInWithPhoneNumber(auth, phoneNumber, verifier);
    } catch (e: any) {
      const msg = e?.message || "";
      // Backoff and retry limited times on rate limiting
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
