import { RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithGoogle } from "@/lib/firebase";

export const googleLogin = async () => {
  try {
    const result = await signInWithGoogle();
    const user = result.user;
    const idToken = await user.getIdToken();
    return { user, idToken, error: null } as const;
  } catch (error) {
    return { user: null, idToken: null, error } as const;
  }
};

export const phoneLogin = async (phoneNumber: string) => {
  try {
    const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return { confirmationResult, error: null } as const;
  } catch (error) {
    return { confirmationResult: null, error } as const;
  }
};

export const emailLogin = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    const idToken = await user.getIdToken();
    return { user, idToken, error: null } as const;
  } catch (error) {
    return { user: null, idToken: null, error } as const;
  }
};
