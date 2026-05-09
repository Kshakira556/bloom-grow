import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { login as loginApi, register as registerApi, SafeUser, getMe } from "@/lib/api";

type AuthContextValue = {
  user: SafeUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    role?: "parent" | "mediator" | "admin";
    phone?: string;
    account_type?: "trial" | "paid";
    invite_id?: string;
  }) => Promise<SafeUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SafeUser | null>(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);

      // ensure backend-added fields are preserved
      return {
        ...parsed,
        is_trial_active: parsed.is_trial_active ?? false,
      };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Cookie-based auth (HttpOnly). Restore session by asking the backend who we are.
    // Keep sessionStorage user as a UI hint, but treat the backend as source of truth.
    (async () => {
      try {
        const me = await getMe();
        setUser(me);
        sessionStorage.setItem("user", JSON.stringify(me));
      } catch {
        // No valid cookie session.
        setUser(null);
        sessionStorage.removeItem("user");
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await loginApi(email, password);

    // Persist only user profile; auth is stored in an HttpOnly cookie set by the backend.
    sessionStorage.setItem("user", JSON.stringify(user));

    setUser(user);

    return user; 
  }, []);

  const register = useCallback(
  async (data) => {
    const { user } = await registerApi(data);

    // Persist only user profile; auth is stored in an HttpOnly cookie set by the backend.
    sessionStorage.setItem("user", JSON.stringify(user));

    setUser(user);

    return user;
  },
  []
);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return ctx;
};
