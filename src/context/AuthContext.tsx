import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { login as loginApi, register as registerApi, SafeUser, getMe } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
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
      // Skip the request entirely unless we have a hint that a session might exist.
      // (We can't read HttpOnly cookies, so we keep a small flag.)
      const hasSessionHint = sessionStorage.getItem("has_session") === "1";
      const hasUserHint = Boolean(sessionStorage.getItem("user"));
      if (!hasSessionHint && !hasUserHint) return;

      const me = await queryClient.fetchQuery({
        queryKey: ["me"],
        queryFn: () => getMe(),
        staleTime: 60_000,
      });
      if (!me) {
        setUser(null);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("has_session");
        queryClient.removeQueries({ queryKey: ["me"] });
        return;
      }

      setUser(me);
      queryClient.setQueryData(["me"], me);
      sessionStorage.setItem("user", JSON.stringify(me));
      sessionStorage.setItem("has_session", "1");
    })();
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await loginApi(email, password);

    // Persist only user profile; auth is stored in an HttpOnly cookie set by the backend.
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("has_session", "1");

    setUser(user);
    queryClient.setQueryData(["me"], user);

    return user; 
  }, [queryClient]);

  const register = useCallback(
  async (data) => {
    const { user } = await registerApi(data);

    // Persist only user profile; auth is stored in an HttpOnly cookie set by the backend.
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("has_session", "1");

    setUser(user);
    queryClient.setQueryData(["me"], user);

    return user;
  },
  [queryClient]
);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("has_session");
    queryClient.removeQueries({ queryKey: ["me"] });
    // Keep plans cached for fast relogin? Safer to clear user-scoped data on logout.
    queryClient.removeQueries({ queryKey: ["plans"] });
    queryClient.removeQueries({ queryKey: ["plan"] });
    queryClient.removeQueries({ queryKey: ["messages"] });
    queryClient.removeQueries({ queryKey: ["planMessages"] });
    queryClient.removeQueries({ queryKey: ["visits"] });
    queryClient.removeQueries({ queryKey: ["children"] });
    queryClient.removeQueries({ queryKey: ["journalCount"] });
  }, [queryClient]);

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
