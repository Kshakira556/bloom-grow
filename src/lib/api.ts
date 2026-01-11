import { http } from "./http";

export type UserRole = "parent" | "mediator" | "admin";

export interface SafeUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface Moderator extends SafeUser {
  isActive: boolean;
  assignedClients: string[];
}

type LoginResponse = {
  user: SafeUser;
  token: string;
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  return http<LoginResponse>("/auth/login", "POST", { email, password });
};

export const getUsers = async (): Promise<SafeUser[]> => {
  const res = await http<{ users: SafeUser[] }>("/users", "GET");
  return res.users;
};

export const getModerators = async (): Promise<Moderator[]> => {
  const res = await http<{ moderators: Moderator[] }>("/admin/moderators", "GET");
  return res.moderators;
};