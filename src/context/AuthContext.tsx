import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { login as loginApi, register as registerApi, SafeUser } from "@/lib/api";
import { setAuthToken } from "@/lib/http";

type ParentRegisterData = {
  full_name: string;
  email: string;
  password: string;
  role?: "parent";
  phone?: string;
};

type MediatorRegisterData = {
  full_name: string;
  email: string;
  password: string;
  role: "mediator";
  phone?: string;
  job_title: string;
  company_name: string;
  company_address: string;
};

type AuthContextValue = {
  user: SafeUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (data: ParentRegisterData | MediatorRegisterData) => Promise<SafeUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const storedToken = sessionStorage.getItem("token");
  if (storedToken) {
    setAuthToken(storedToken);
  }

  const [user, setUser] = useState<SafeUser | null>(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      setAuthToken(token);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await loginApi(email, password);

    setAuthToken(token);
    sessionStorage.setItem("token", token);
    setUser(user);
    sessionStorage.setItem("user", JSON.stringify(user));

    return user; 
  }, []);

  const register = useCallback(
  async (data: ParentRegisterData | MediatorRegisterData) => {
    const { user, token } = await registerApi(data);

    setAuthToken(token);
    setUser(user);
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));

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
