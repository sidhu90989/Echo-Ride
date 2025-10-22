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
} from "firebase/auth";

const SIMPLE_AUTH = import.meta.env.VITE_SIMPLE_AUTH === 'true';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let recaptcha: RecaptchaVerifier | undefined;

if (!SIMPLE_AUTH) {
  // Use env-based config populated in .env (already set to provided values)
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  } as const;

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

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
export function ensureRecaptcha(containerId = "recaptcha-container") {
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
  recaptcha = new RecaptchaVerifier(auth, container, { size: "invisible" });
  return recaptcha;
}

export async function signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult> {
  if (!auth) throw new Error("Firebase auth not initialized");
  const verifier = ensureRecaptcha();
  try {
    return await fbSignInWithPhoneNumber(auth, phoneNumber, verifier);
  } catch (e) {
    throw new Error(mapFirebaseError(e));
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
