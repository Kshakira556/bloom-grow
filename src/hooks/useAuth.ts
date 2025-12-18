import { useAuthContext } from "@/context/AuthContext";

export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthContext();

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
};
