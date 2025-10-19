import { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import type { User } from "@shared/schema";
import { withApiBase } from "@/lib/apiBase";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const SIMPLE_AUTH = import.meta.env.VITE_SIMPLE_AUTH === 'true';
    if (SIMPLE_AUTH) {
      // On load, try verify using session (no Authorization header)
      (async () => {
        try {
          const response = await fetch(withApiBase("/api/auth/verify"), { credentials: 'include' });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (e) {
          setUser(null);
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    if (!auth) {
      // Firebase not configured; treat as logged out
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(withApiBase("/api/auth/verify"), {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error("Error verifying auth:", error);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const SIMPLE_AUTH = import.meta.env.VITE_SIMPLE_AUTH === 'true';
    try {
      if (SIMPLE_AUTH) {
        // No-op here; LoginPage will call /api/auth/login directly
        return;
      }
      if (!auth || !googleProvider) {
        throw new Error("Firebase auth not initialized");
      }
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    const SIMPLE_AUTH = import.meta.env.VITE_SIMPLE_AUTH === 'true';
    try {
      if (SIMPLE_AUTH) {
  await fetch(withApiBase('/api/auth/logout'), { method: 'POST', credentials: 'include' });
        setUser(null);
        return;
      }
      if (!auth) {
        // Nothing to do
        setUser(null);
        return;
      }
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, signInWithGoogle, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
