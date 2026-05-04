import { http } from "./http";
import type { MessagePurpose } from "@/types/messages";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

// --------------------
// User/Auth
// --------------------
export type UserRole = "parent" | "mediator" | "admin" | "cub_internal";

export interface SafeUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  account_type?: "trial" | "paid";
  subscription_status?: "trial" | "active" | "pending_payment" | "canceled";
  is_trial_active?: boolean;
  trial_ends_at?: string | Date | null;
  requires_payment?: boolean;
  marketing_opt_in?: boolean;
  marketing_opt_in_at?: string | null;
  marketing_unsubscribed_at?: string | null;
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

export const getMyInvites = async (): Promise<{ invites: PlanInvite[] }> => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return { invites: [] };
  }

  const res = await fetch(`${API_URL}/plans/invites`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // Prevent breaking UI flow on visits page
    console.warn("Failed to fetch invites:", res.status);
    return { invites: [] };
  }

  return res.json();
};

export const acceptInvite = async (invite_id: string) => {
  const res = await fetch(`${API_URL}/plans/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
    body: JSON.stringify({ invite_id }),
  });

  if (!res.ok) throw new Error("Failed to accept invite");
  return res.json();
};

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
  role?: UserRole;
  phone?: string;
  account_type?: "trial" | "paid";
  invite_id?: string;
  terms_accepted?: boolean;
  terms_version?: string;
  privacy_version?: string;
  terms_accepted_at?: string;
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

export const login = async (email: string, password: string) => {
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
// Privacy Requests
// --------------------
export type PrivacyRequestType = "access" | "correction" | "deletion" | "objection";

export const createPrivacyRequest = async (payload: {
  request_type: PrivacyRequestType;
  details?: string;
  contact_email?: string;
}) => {
  return http<{ request: { id: string } }>("/privacy/requests", "POST", payload);
};

export const downloadMyDataExport = async () => {
  const token = sessionStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/privacy/my-data`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to export data");
  }

  return res.json();
};

export const downloadMyDataExportBundle = async (): Promise<Blob> => {
  const token = sessionStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/privacy/my-data/bundle`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Export failed (${res.status})`);
  }

  return res.blob();
};

// --------------------
// Account deletion
// --------------------
export const requestAccountDeletion = async (payload?: { reason?: string }) => {
  return http<{ request: { id: string; scheduled_for?: string | null } }>(
    "/users/deletion-request",
    "POST",
    payload ?? {}
  );
};

export const setMarketingOptIn = async (opt_in: boolean) => {
  return http<{ user: Pick<SafeUser, "id" | "marketing_opt_in" | "marketing_opt_in_at" | "marketing_unsubscribed_at"> }>(
    "/users/marketing/opt-in",
    "POST",
    { opt_in }
  );
};

export const getVaultDocumentSignedUrl = async (documentId: string) => {
  const res = await http<{ url: string }>(`/vaults/documents/${documentId}/signed-url`, "GET");
  return res.url;
};

// --------------------
// Audit (client-side events)
// --------------------
export const createAuditEvent = async (payload: {
  action: string;
  target_type?: string;
  target_id?: string;
  notes?: Record<string, unknown> | string;
}) => {
  const body = {
    action: payload.action,
    target_type: payload.target_type ?? null,
    target_id: payload.target_id ?? null,
    notes:
      typeof payload.notes === "string"
        ? payload.notes
        : payload.notes
        ? JSON.stringify(payload.notes)
        : null,
  };

  return http<{ log: { id: string } }>("/audit/events", "POST", body);
};

// --------------------
// Plans
// --------------------
export interface Plan {
  id: string;
  title: string;
  created_by?: string;
  status?: string;
}

export interface PlanInvitePayload {
  planId: string;
  email: string;
}

export interface PlanInvite {
  id: string;
  plan_id: string;
  family_id?: string | null;
  email: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

// --------------------
// CUB internal: Privacy requests workflow
// --------------------

export type PrivacyRequestStatus = "open" | "in_progress" | "closed";

export type PrivacyRequest = {
  id: string;
  user_id: string | null;
  contact_email: string | null;
  request_type: "access" | "correction" | "deletion" | "objection";
  details: string | null;
  status: PrivacyRequestStatus;
  created_at: string;
  updated_at?: string | null;
};

export const getCubPrivacyRequests = async (args?: { status?: PrivacyRequestStatus; limit?: number }) => {
  const params = new URLSearchParams();
  if (args?.status) params.set("status", args.status);
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  const qs = params.toString();
  const res = await http<{ requests: PrivacyRequest[] }>(`/cub/privacy/requests${qs ? `?${qs}` : ""}`, "GET");
  return res.requests;
};

export const updateCubPrivacyRequestStatus = async (id: string, status: PrivacyRequestStatus) => {
  return http<{ request: PrivacyRequest }>(`/cub/privacy/requests/${id}`, "PUT", { status });
};
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
    console.warn("Failed to fetch plans:", err);
    return { plans: [] };
  }
}

type CreatePlanResponse = Plan | { plan: Plan };

export const createPlan = async (payload: {
  title: string;
  created_by: string;
}) => {
  const response = await http<CreatePlanResponse>("/plans", "POST", payload);

  if (
    response &&
    typeof response === "object" &&
    "plan" in response &&
    response.plan
  ) {
    return response.plan;
  }

  return response;
};

export const getPlanById = async (id: string): Promise<{ plan: FullPlan }> => {
  return http<{ plan: FullPlan }>(`/plans/${id}`, "GET");
};

export const inviteToPlan = async (payload: PlanInvitePayload) => {
  return http("/plans/invite", "POST", {
    plan_id: payload.planId,   
    email: payload.email,
  });
};

export const acceptPlanInvite = async (invite: { invite_id?: string; invite_token?: string } | string) => {
  if (typeof invite === "string") {
    return http("/plans/accept", "POST", { invite_id: invite });
  }
  return http("/plans/accept", "POST", invite);
};

export const resolvePlanInviteToken = async (token: string): Promise<{ invite_id: string; email: string; account_type: "trial" | "paid" }> => {
  const res = await http<{ invite: { invite_id: string; email: string; account_type: "trial" | "paid" } }>(
    `/plans/invites/token/${encodeURIComponent(token)}`,
    "GET"
  );
  return res.invite;
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
  status: "scheduled" | "completed" | "cancelled" | "missed";
  is_deleted?: boolean | "true" | "false" | "t" | "f" | 0 | 1;
}

export interface VisitChangeRequest {
  id: string;
  visit_id: string | null;
  plan_id: string;
  requested_by: string;
  request_type: "create" | "update" | "delete";
  proposed_data?: Record<string, unknown> | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  applied_at?: string | null;
}

export async function getVisitsByPlan(
  planId: string,
  options?: { includeDeleted?: boolean },
): Promise<{ success: boolean; data: ApiVisit[] }> {
  const query = options?.includeDeleted ? "?include_deleted=true" : "";
  return http(`/visits/plan/${planId}${query}`, "GET");
}

export const createVisit = async (payload: {
  plan_id: string;
  child_id: string;
  parent_id: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  status?: string;
}) => {
  const res = await http<{ success: boolean; data: ApiVisit }>("/visits", "POST", payload);
  return res.data;
};

export const requestVisitCreate = async (payload: {
  plan_id: string;
  child_id: string;
  parent_id: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  status?: string;
}) => {
  return http<
    | { success: true; mode: "applied"; data: ApiVisit }
    | { success: true; mode: "pending"; request: VisitChangeRequest }
  >("/visits/request-create", "POST", payload);
};

export const updateVisit = async (
  id: string,
  payload: Partial<{
    plan_id: string;
    child_id: string;
    start_time: string;
    end_time: string;
    location: string;
    notes: string;
    status: string;
  }>
) => {
  const res = await http<{ success: boolean; data: ApiVisit }>(`/visits/${id}`, "PUT", payload);
  return res.data;
};

export const deleteVisit = async (id: string) => {
  const res = await http<{ success: boolean; data: { id: string; is_deleted: boolean } }>(`/visits/${id}`, "DELETE");
  return res.data;
};

export const requestVisitEdit = async (
  id: string,
  payload: Partial<{
    start_time: string;
    end_time: string;
    location: string;
    notes: string;
    status: string;
  }>,
) => {
  return http<
    | { success: true; mode: "applied"; data: ApiVisit }
    | { success: true; mode: "pending"; request: VisitChangeRequest }
  >(`/visits/${id}/request-edit`, "POST", payload);
};

export const requestVisitDelete = async (id: string) => {
  return http<
    | { success: true; mode: "applied"; data: { id: string; is_deleted: boolean } }
    | { success: true; mode: "pending"; request: VisitChangeRequest }
  >(`/visits/${id}/request-delete`, "POST");
};

export const getPendingVisitRequests = async (planId: string) => {
  const res = await http<{ success: boolean; requests: VisitChangeRequest[] }>(
    `/visits/plan/${planId}/requests`,
    "GET",
  );
  return res.requests ?? [];
};

export const reviewVisitRequest = async (
  requestId: string,
  decision: "approved" | "rejected",
) => {
  return http<{
    success: boolean;
    mode: "approved_applied" | "rejected";
    request: VisitChangeRequest;
    data: ApiVisit | { id: string; is_deleted: boolean } | null;
  }>(`/visits/requests/${requestId}/review`, "POST", { decision });
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
  is_flagged: boolean;
  flagged_reason?: string;
  is_deleted?: boolean;
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
  const res = await http<{ message: ApiMessage }>(`/messages/${id}`, "PUT", {
    is_flagged: true,
    flagged_reason: reason,
  });
  return res.message;
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
  const res = await http<{ children: Child[] }>("/children", "GET");
  return res.children;
};

export const createChild = async (payload: {
  first_name: string;
  last_name?: string;
  birth_date?: string;
  notes?: string;
  plan_id?: string;
}) => {
  return http<{ child: Child }>("/children", "POST", payload);
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

export const inviteUser = async (
  payload: InviteUserPayload & { linked_user_id?: string | null }
) => {
  return http<{ contact?: ApiContact; invite?: ContactInvite }>("/contacts", "POST", {
    ...payload,
    linked_user_id: payload.linked_user_id ?? null, // ✅ enforce null instead of ""
  });
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
export interface ContactInvite {
  id: string;
  requester_user_id: string;
  target_user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  relationship?: string | null;
  status: "pending" | "accepted" | "rejected";
  responded_at?: string | null;
  created_at: string;
}

export const getContacts = async (): Promise<ApiContact[]> => {
  const res = await http<{ contacts: ApiContact[] }>("/contacts", "GET");
  return res?.contacts ?? [];
};
export const getContactInvites = async (): Promise<ContactInvite[]> => {
  const res = await http<{ invites: ContactInvite[] }>("/contacts/invites", "GET");
  return res?.invites ?? [];
};

export const respondToContactInvite = async (
  inviteId: string,
  decision: "accepted" | "rejected"
) => {
  return http<{ invite: ContactInvite }>(
    "/contacts/invites/" + inviteId + "/respond",
    "POST",
    { decision }
  );
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

export type AccountDeletionRequest = {
  id: string;
  user_id: string;
  requested_at: string;
  scheduled_for: string;
  processed_at: string | null;
  status: "pending" | "processed" | "canceled" | string;
  reason: string | null;
};

export const getAccountDeletionRequests = async (options?: { status?: string }) => {
  const q = options?.status ? `?status=${encodeURIComponent(options.status)}` : "";
  const res = await http<{ requests: AccountDeletionRequest[] }>(`/admin/deletions/requests${q}`, "GET");
  return res?.requests ?? [];
};

export const processAccountDeletions = async (options?: { limit?: number }) => {
  const q = typeof options?.limit === "number" ? `?limit=${encodeURIComponent(String(options.limit))}` : "";
  return http<{ processed: number }>(`/admin/deletions/process${q}`, "POST");
};

// --------------------
// CUB Internal Dashboard (cub_internal role)
// --------------------
export type CubUserMetrics = {
  totals: {
    users: number;
    parents: number;
    mediators: number;
    admins: number;
    cub_internal: number;
  };
  subscriptions: {
    paid: number;
    trial: number;
  };
};

export const getCubUserMetrics = async (): Promise<CubUserMetrics> => {
  const res = await http<{ metrics: CubUserMetrics }>("/cub/metrics/users", "GET");
  return res.metrics;
};

export type CubStorageUsage = {
  total_bytes: number;
  total_files: number;
  by_prefix: Record<string, { bytes: number; files: number }>;
};

export const getCubStorageUsage = async (): Promise<CubStorageUsage> => {
  const res = await http<{ usage: CubStorageUsage }>("/cub/metrics/storage", "GET");
  return res.usage;
};

export const getCubAuditLogs = async (): Promise<AuditLog[]> => {
  const res = await http<{ logs: AuditLog[] }>("/cub/audit-logs", "GET");
  return res.logs;
};

export const getCubDeletionRequests = async (): Promise<AccountDeletionRequest[]> => {
  const res = await http<{ requests: AccountDeletionRequest[] }>("/cub/deletions/requests", "GET");
  return res.requests;
};

export const processCubDeletions = async (options?: { limit?: number }) => {
  const q = typeof options?.limit === "number" ? `?limit=${encodeURIComponent(String(options.limit))}` : "";
  return http<{ processed: number }>(`/cub/deletions/process${q}`, "POST");
};

export const setCubUserLegalHold = async (userId: string, payload: { legal_hold: boolean; reason?: string }) => {
  return http<{ user: { id: string; legal_hold: boolean } }>(`/cub/legal-hold/users/${userId}`, "PUT", payload);
};

export const setCubPlanLegalHold = async (planId: string, payload: { legal_hold: boolean; reason?: string }) => {
  return http<{ plan: { id: string; legal_hold: boolean } }>(`/cub/legal-hold/plans/${planId}`, "PUT", payload);
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

export const fetchAllPlanMessages = async (
  plans: { id: string }[],
  options?: { includeDeleted?: boolean }
): Promise<ApiMessage[]> => {
  const allMessages: ApiMessage[] = [];

  for (const plan of plans) {
    const messages = await getMessagesByPlan(plan.id, options);
    allMessages.push(...messages);
  }

  return allMessages;
};

