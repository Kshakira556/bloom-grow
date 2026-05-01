import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { login as loginApi, register as registerApi, SafeUser } from "@/lib/api";
import { setAuthToken } from "@/lib/http";

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
    const token = sessionStorage.getItem("token");
    if (token) {
      setAuthToken(token);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await loginApi(email, password);

    // 1. Persist first
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));

    // 2. Then apply
    setAuthToken(token);
    setUser(user);

    return user; 
  }, []);

  const register = useCallback(
  async (data) => {
    const { user, token } = await registerApi(data);

    // 1. Persist FIRST (critical)
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));

    // 2. Set token globally BEFORE React updates
    setAuthToken(token);

    // 3. Then update React state
    setUser(user);

    return user;
  },
  []
);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
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
