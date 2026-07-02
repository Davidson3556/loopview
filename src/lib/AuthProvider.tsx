"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { insforge } from "./insforge";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** Re-read the current user from the SDK (after sign in/out). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await insforge.auth.getCurrentUser();
    setUser(error ? null : ((data?.user as AuthUser | undefined) ?? null));
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await insforge.auth.signOut();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (cancelled) return;
      setUser(error ? null : ((data?.user as AuthUser | undefined) ?? null));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
