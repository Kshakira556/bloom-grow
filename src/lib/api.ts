import { http } from "./http";
import type { MessagePurpose } from "@/types/messages";

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

export interface Child {
  id: string;
  first_name: string;
  last_name?: string;
  birth_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
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
  title: string;\n  created_by?: string;\n  status?: string;
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
export interface PlanChild {
  id: string;
  name: string;
}
export interface FullPlan extends Plan {
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  created_at: string;
  invites: PlanInvite[];
  children?: PlanChild[];
}

export interface JournalEntryPayload {
  plan_id: string;
  child_id: string;
  author_id: string;
  content: string;
  title?: string;
  mood?: string;
  image?: string;
  entry_date: string;
}

export interface ApiJournalEntry  {
  id: string;
  plan_id: string;
  child_id: string;
  author_id: string;
  content: string;
  title?: string;
  mood?: string;
  image?: string;
  entry_date: string;
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
  child_id: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  status?: string;
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
  updated_at?: string | null;
  purpose?: MessagePurpose;
  is_flagged: boolean;\n  flagged_reason?: string;\n  is_deleted?: boolean;
  is_seen?: boolean;
  attachments?: Attachment[];
}

export const getMessagesByPlan = async (
  planId: string,
  options?: { includeDeleted?: boolean }
) => {
  const query = options?.includeDeleted ? "?include_deleted=true" : "";
  const res = await http<{ messages: ApiMessage[] }>(
    `/messages/plan/${planId}${query}`,
    "GET"
  );
  return res.messages;
};

export type SendMessagePayload = {
  sender_id: string;
  receiver_id: string;
  plan_id: string;
  content: string;
  purpose?: MessagePurpose;
  attachments?: Attachment[];
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
export interface ApiMessageHistory {
  id: string;
  message_id: string;
  sender_id: string;
  receiver_id: string;
  plan_id: string;
  content: string;
  action_type: "create" | "update" | "delete";
  action_by: string;
  action_at: string;
  is_seen?: boolean;
  seen_at?: string | null;
  deleted_by?: string | null;
}

export interface Proposal {
  id: string;
  plan_id: string;
  created_by: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface ReviewHistory {
  id: string;
  message_id: string;
  reviewer_id: string;
  action: "approved" | "rejected" | "flagged" | "noted";
  notes?: string | null;
  created_at: string;
}
export const getMessageHistory = async (id: string) => {
  const res = await http<{ history: ApiMessageHistory[] }>(
    `/messages/history/${id}`,
    "GET"
  );
  return res?.history ?? [];
};

export const flagMessage = async (id: string, reason?: string) => {
  return http(`/messages/${id}`, "PUT", {
    is_flagged: true,
    flagged_reason: reason,
  });
};

export const createJournalEntry = async (
  payload: JournalEntryPayload
): Promise<ApiJournalEntry> => {
  return http<ApiJournalEntry>("/journal", "POST", payload);
};

export const getJournalEntriesByChild = async (
  childId: string
): Promise<ApiJournalEntry[]> => {
  const res = await http<{ entries: ApiJournalEntry[] }>(
    `/journal/child/${childId}`,
    "GET"
  );
  return res.entries;
};

export const updateJournalEntry = async (
  id: string, 
  payload: Partial<ApiJournalEntry>
) => {
  return http<ApiJournalEntry>(`/journal/${id}`, "PUT", payload);
};

export const deleteJournalEntry = async (
  id: string
) => {
  return http<void>(`/journal/${id}`, "DELETE");
};

export const getChildren = async (): Promise<Child[]> => {
  const res = await fetch("/api/children");
  if (!res.ok) throw new Error("Failed to fetch children");
  const data = await res.json();
  return data.children; 
};

// Update message
export const updateMessage = async (
  id: string,
  payload: Partial<{ content: string }>
): Promise<ApiMessage> => {
  const res = await http<{ message: ApiMessage }>(
    `/messages/${id}`,
    "PUT",
    payload
  );
  return res.message;
};

// Delete message
export const deleteMessage = async (id: string): Promise<void> => {
  return http<void>(`/messages/${id}`, "DELETE");
};


// --------------------
// Contacts / Invite Users
// --------------------
export interface InviteUserPayload {
  name: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

export const inviteUser = async (payload: InviteUserPayload) => {
  return http("/contacts", "POST", payload);
};
export interface ApiContact {
  id: string;
  user_id: string;
  linked_user_id?: string | null;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  created_at: string;
  updated_at?: string | null;
  purpose?: MessagePurpose;
}

export const getContacts = async (): Promise<ApiContact[]> => {
  const res = await http<{ contacts: ApiContact[] }>("/contacts", "GET");
  return res?.contacts ?? [];
};








export const getProposals = async (status?: "pending" | "approved" | "rejected") => {
  const query = status ? `?status=${status}` : "";
  const res = await http<{ proposals: Proposal[] }>(`/proposals${query}`, "GET");
  return res?.proposals ?? [];
};
export const createProposal = async (payload: {
  plan_id: string;
  title: string;
  description: string;
  created_by: string;
}) => {
  const res = await http<{ proposal: Proposal }>("/proposals", "POST", payload);
  return res?.proposal;
};

export const updateProposalStatus = async (
  id: string,
  payload: { status: "pending" | "approved" | "rejected"; reviewed_by?: string }
) => {
  const res = await http<{ proposal: Proposal }>(`/proposals/${id}`, "PUT", payload);
  return res?.proposal;
};

export const getReviewHistory = async () => {
  const res = await http<{ reviews: ReviewHistory[] }>("/moderation/reviews", "GET");
  return res?.reviews ?? [];
};

export const createReview = async (payload: {
  message_id: string;
  reviewer_id: string;
  action: "approved" | "rejected" | "flagged" | "noted";
  notes?: string;
}) => {
  const res = await http<{ review: ReviewHistory }>("/moderation/reviews", "POST", payload);
  return res?.review;
};


export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export const getAuditLogs = async () => {
  const res = await http<{ logs: AuditLog[] }>("/admin/audit-logs", "GET");
  return res?.logs ?? [];
};

export const getAdminMessages = async (options?: { includeDeleted?: boolean }) => {
  const query = options?.includeDeleted ? "?include_deleted=true" : "";
  const res = await http<{ messages: ApiMessage[] }>(`/admin/messages${query}`, "GET");
  return res?.messages ?? [];
};

export interface ModeratorAssignment {
  id: string;
  moderator_id: string;
  plan_id: string;
  status: "active" | "pending";
  created_at: string;
}

export const getModeratorAssignments = async () => {
  const res = await http<{ assignments: ModeratorAssignment[] }>(
    "/admin/moderator-assignments",
    "GET"
  );
  return res?.assignments ?? [];
};

export const createModeratorAssignment = async (payload: {
  moderator_id: string;
  plan_id: string;
  status?: "active" | "pending";
}) => {
  const res = await http<{ assignment: ModeratorAssignment }>(
    "/admin/moderator-assignments",
    "POST",
    payload
  );
  return res?.assignment;
};

