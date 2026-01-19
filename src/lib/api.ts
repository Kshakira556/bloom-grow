import { http } from "./http";

// --------------------
// User/Auth
// --------------------
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

type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  user: SafeUser;
  token: string;
};

export const register = async (
  payload: RegisterPayload
): Promise<RegisterResponse> => {
  return http<RegisterResponse>("/users/register", "POST", payload);
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

export const getUserByEmail = async (email: string) => {
  const res = await http<{ id: string; full_name: string; email: string }>(`/users/email/${email}`, "GET");
  if (!res) throw new Error("User not found");
  return res;
};

export const getModerators = async (): Promise<Moderator[]> => {
  const res = await http<{ moderators: Moderator[] }>("/admin/moderators", "GET");
  return res.moderators;
};

// --------------------
// Plans
// --------------------
export interface Plan {
  id: string;
  title: string;
}

export interface PlanInvitePayload {
  planId: number;
  email: string;
}

export interface PlanInvite {
  id: string;
  plan_id: string;
  email: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface FullPlan extends Plan {
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  created_at: string;
  invites: PlanInvite[];
}

export async function getPlans(): Promise<{ plans: Plan[] }> {
  try {
    return await http<{ plans: Plan[] }>("/plans", "GET"); 
  } catch (err) {
    console.error("Failed to fetch plans:", err);
    return { plans: [] }; 
  }
}

export const createPlan = async (name: string): Promise<Plan> => {
  return http<Plan>("/plans", "POST", { name });
};

export const getPlanById = async (id: string): Promise<{ plan: FullPlan }> => {
  return http<{ plan: FullPlan }>(`/plans/${id}`, "GET");
};

export const inviteToPlan = async (payload: PlanInvitePayload) => {
  return http("/plans/invite", "POST", payload);
};

export const acceptPlanInvite = async (planId: number) => {
  return http("/plans/accept", "POST", { planId });
};

// --------------------
// Visits
// --------------------
export type VisitType = "mine" | "theirs" | "deleted";

export interface ApiVisit {
  id: string;
  plan_id: string;
  child_id: string;
  parent_id: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
  status: "scheduled" | "completed" | "cancelled";
}

export async function getVisitsByPlan(
  planId: string
): Promise<{ success: boolean; data: ApiVisit[] }> {
  return http(`/visits/plan/${planId}`, "GET");
}

export const createVisit = async (payload: {
  plan_id: string;
  start_time: string;
  end_time: string;
}) => {
  return http<ApiVisit>("/visits", "POST", payload);
};

export const updateVisit = async (
  id: string,
  payload: Partial<{
    start_time: string;
    end_time: string;
    location: string;
    notes: string;
    status: string;
  }>
) => {
  return http<ApiVisit>(`/visits/${id}`, "PUT", payload);
};

export const deleteVisit = async (id: string) => {
  return http<void>(`/visits/${id}`, "DELETE");
};

// --------------------
// Messages
// --------------------
export type AttachmentType = "Document" | "Medical Note" | "Court Order" | "Report";

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
}
export interface ApiMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  plan_id: string;
  content: string;
  created_at: string;
  is_flagged: boolean;
  is_seen?: boolean;
  attachments?: Attachment[];
}

export const getMessagesByPlan = async (planId: string) => {
  const res = await http<{ messages: ApiMessage[] }>(
    `/messages/plan/${planId}`,
    "GET"
  );
  return res.messages;
};

export type SendMessagePayload = {
  sender_id: string;
  receiver_id: string;
  plan_id: string;
  content: string;
};

export const sendMessage = async (
  payload: SendMessagePayload
): Promise<ApiMessage> => {
  const res = await http<{ message: ApiMessage }>(
    "/messages",
    "POST",
    payload
  );
  return res.message;
};

export const markMessageAsSeen = async (id: string) => {
  const res = await http<{ message: ApiMessage }>(
    `/messages/seen/${id}`,
    "PUT"
  );
  return res.message;
};

export const flagMessage = async (id: string, reason?: string) => {
  return http(`/messages/${id}`, "PUT", {
    is_flagged: true,
    flagged_reason: reason,
  });
};
