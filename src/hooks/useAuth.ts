import { useAuthContext } from "@/context/AuthContext";

export const useAuth = () => {
  const { user, isAuthenticated, login, register, logout } = useAuthContext();

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
  };
};
