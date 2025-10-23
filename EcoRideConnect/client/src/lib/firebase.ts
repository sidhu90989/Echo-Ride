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

// Clean, native Firebase config (no OIDC). Updated with trusty-diorama credentials.
const firebaseConfig = {
  apiKey: "AIzaSyAyoxCh_tJzFHwMNSX1Zs6Ez1EmYMxxUPg",
  authDomain: "trusty-diorama-475905-c3.firebaseapp.com",
  projectId: "trusty-diorama-475905-c3",
  storageBucket: "trusty-diorama-475905-c3.firebasestorage.app",
  messagingSenderId: "805719737795",
  appId: "1:805719737795:web:fdf6eb93864fcde7b8a976",
  measurementId: "G-2BZXC1LWPM",
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
export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (e: any) {
    const code = e?.code || "";
    if (String(code).includes("auth/unauthorized-domain")) {
      const host = typeof window !== "undefined" ? window.location.host : "this domain";
      throw new Error(
        `Unauthorized domain: ${host}. Add this exact host to Firebase → Authentication → Settings → Authorized domains (project: ${firebaseConfig.projectId}).`
      );
    }
    throw e;
  }
};

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
