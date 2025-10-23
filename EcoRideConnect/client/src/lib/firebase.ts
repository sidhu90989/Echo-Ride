import { initializeApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  PhoneAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber as fbSignInWithPhoneNumber,
  type ConfirmationResult,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";

// Clean, native Firebase config (no OIDC). Updated with EcoRide project credentials.
const firebaseConfig = {
  apiKey: "AIzaSyD2EOQDEyeBxeFT4_rrNLejmaqBtUxyGuM",
  authDomain: "ecoride-f86b9.firebaseapp.com",
  projectId: "ecoride-f86b9",
  storageBucket: "ecoride-f86b9.firebasestorage.app",
  messagingSenderId: "937932926319",
  appId: "1:937932926319:web:70805c9dd506c2e1f50c9a",
  measurementId: "G-FGTJEYE2DL",
} as const;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Optional: Analytics (browser-only)
let analytics: Analytics | undefined;
try {
  if (typeof window !== "undefined" && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
} catch {}

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

export const phoneProvider = new PhoneAuthProvider(auth);
export const emailProvider = EmailAuthProvider;

// Helpers used by LoginPage (keep signatures stable)
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

let recaptcha: RecaptchaVerifier | undefined;

export function ensureRecaptcha(
  containerId = "recaptcha-container",
  options?: { size?: "invisible" | "normal" | "compact"; theme?: "light" | "dark" }
) {
  if (recaptcha) return recaptcha;
  const el = document.getElementById(containerId) || (() => {
    const div = document.createElement("div");
    div.id = containerId;
    div.style.position = "fixed";
    div.style.bottom = "-9999px";
    document.body.appendChild(div);
    return div;
  })();
  recaptcha = new RecaptchaVerifier(auth, el, { size: options?.size || "invisible", theme: options?.theme });
  return recaptcha;
}

export function refreshRecaptcha(
  containerId = "recaptcha-container",
  options?: { size?: "invisible" | "normal" | "compact"; theme?: "light" | "dark" }
) {
  try {
    if (recaptcha) recaptcha.clear();
  } catch {}
  recaptcha = undefined;
  return ensureRecaptcha(containerId, options);
}

export async function signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult> {
  const verifier = ensureRecaptcha("recaptcha-container", { size: "normal", theme: "light" });
  return fbSignInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function confirmOTP(confirmation: ConfirmationResult, otp: string) {
  return confirmation.confirm(otp);
}

export function onAuthStateChanged(cb: (user: User | null) => void) {
  return fbOnAuthStateChanged(auth, cb);
}

export async function signOut() {
  await fbSignOut(auth);
}

export { app };
export { analytics };
