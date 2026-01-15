import React, { createContext, useContext, useState, useCallback } from "react";
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
  }) => Promise<SafeUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SafeUser | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await loginApi(email, password);

    setAuthToken(token);
    localStorage.setItem("token", token);
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));

    return user; 
  }, []);

  const register = useCallback(
  async (data: { full_name: string; email: string; password: string }) => {
    const { user, token } = await registerApi(data);

    setAuthToken(token);
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  },
  []
);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
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
