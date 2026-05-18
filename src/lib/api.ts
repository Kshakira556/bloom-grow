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
  if (!API_URL) throw new Error("API is not configured. Set VITE_API_URL.");

  const res = await fetch(`${API_URL}/plans/invites`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    // Prevent breaking UI flow on visits page
    console.warn("Failed to fetch invites:", res.status);
    return { invites: [] };
  }

  return res.json();
};

export const acceptInvite = async (invite_id: string) => {
  if (!API_URL) throw new Error("API is not configured. Set VITE_API_URL.");

  const res = await fetch(`${API_URL}/plans/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
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

export const getMe = async (): Promise<SafeUser | null> => {
  // Avoid noisy console errors on cold loads: treat 401 as "not signed in"
  // and return null instead of throwing.
  if (!API_URL) throw new Error("API is not configured. Set VITE_API_URL.");

  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load session");

  const data = (await res.json()) as { user: SafeUser };
  return data.user;
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

// Best-effort: fetch a single user by id. Use sparingly (e.g. small known sets like
// participants in mediator-assigned plans). Server-side must still enforce access control.
export const getUserById = async (id: string): Promise<SafeUser | null> => {
  try {
    const res = await http<{ user: SafeUser }>(`/users/${id}`, "GET");
    return res?.user ?? null;
  } catch {
    return null;
  }
};

export const getUsersByIds = async (ids: string[]): Promise<SafeUser[]> => {
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  if (!uniq.length) return [];

  const results = await Promise.all(uniq.map(async (id) => getUserById(id)));
  return results.filter((u): u is SafeUser => Boolean(u));
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
  if (!API_URL) throw new Error("API is not configured. Set VITE_API_URL.");
  const res = await fetch(`${API_URL}/privacy/my-data`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to export data");
  }

  return res.json();
};

export const downloadMyDataExportBundle = async (): Promise<Blob> => {
  if (!API_URL) throw new Error("API is not configured. Set VITE_API_URL.");
  const res = await fetch(`${API_URL}/privacy/my-data/bundle`, {
    headers: {
      // no content-type header for download
    },
    credentials: "include",
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
// Dashboard
// --------------------
export type DashboardSummary = {
  plan_id: string;
  unread_messages: {
    count: number;
    preview: Array<{
      id: string;
      sender_id: string;
      content: string;
      created_at: string;
    }>;
  };
  pending_visit_requests_count: number;
  shared_documents_count: number;
  upcoming_shared_sessions_count: number;
  next_shared_session: null | {
    id: string;
    starts_at: string;
    ends_at: string | null;
    mode: string;
    location: string | null;
    agenda: string | null;
  };
};

export const getDashboardSummary = async (args: {
  plan_id: string;
  unread_limit?: number;
  unread_offset?: number;
}): Promise<DashboardSummary> => {
  const params = new URLSearchParams();
  params.set("plan_id", args.plan_id);
  if (typeof args.unread_limit === "number") params.set("unread_limit", String(args.unread_limit));
  if (typeof args.unread_offset === "number") params.set("unread_offset", String(args.unread_offset));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await http<{ summary: DashboardSummary }>(`/dashboard/summary${qs}`, "GET");
  return res.summary;
};

// --------------------
// CUB internal: Privacy requests workflow
// --------------------

export type PrivacyRequestStatus = "pending" | "acknowledged" | "fulfilled" | "rejected";

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

export const getCubPrivacyRequests = async (args?: { status?: PrivacyRequestStatus; limit?: number; from?: string; to?: string }) => {
  const params = new URLSearchParams();
  if (args?.status) params.set("status", args.status);
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  if (args?.from) params.set("from", args.from);
  if (args?.to) params.set("to", args.to);
  const qs = params.toString();
  const res = await http<{ requests: PrivacyRequest[] }>(`/cub/privacy/requests${qs ? `?${qs}` : ""}`, "GET");
  return res.requests;
};

export const updateCubPrivacyRequestStatus = async (id: string, status: PrivacyRequestStatus) => {
  return http<{ request: PrivacyRequest }>(`/cub/privacy/requests/${id}`, "PUT", { status });
};

export const getCubPendingPlanDestructions = async (): Promise<number> => {
  const res = await http<{ pending: number }>(`/cub/destructions/pending`, "GET");
  return typeof res.pending === "number" ? res.pending : 0;
};

export type CubDecisionLogEntry = {
  id: string;
  actor_id: string;
  category: string;
  title: string;
  details: string | null;
  created_at: string;
};

export const listCubDecisionLog = async (args?: { from?: string; to?: string; limit?: number }) => {
  const params = new URLSearchParams();
  if (args?.from) params.set("from", args.from);
  if (args?.to) params.set("to", args.to);
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  const qs = params.toString();
  const res = await http<{ entries: CubDecisionLogEntry[] }>(`/cub/decisions${qs ? `?${qs}` : ""}`, "GET");
  return res.entries;
};

export const createCubDecisionLog = async (payload: { category: string; title: string; details?: string }) => {
  const res = await http<{ entry: CubDecisionLogEntry }>(`/cub/decisions`, "POST", payload);
  return res.entry;
};

export type CubUserListRow = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole | string;
  account_type: "trial" | "paid" | string | null;
  subscription_status: string | null;
  created_at: string | null;
  deleted_at: string | null;
  legal_hold?: boolean | null;
  children_count?: number;
  plans_count?: number;
};

export const getCubUsers = async (args?: { role?: UserRole | "all"; q?: string; limit?: number; offset?: number }) => {
  const params = new URLSearchParams();
  if (args?.role) params.set("role", args.role);
  if (args?.q) params.set("q", args.q);
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  if (typeof args?.offset === "number") params.set("offset", String(args.offset));
  const qs = params.toString();
  return http<{ users: CubUserListRow[]; limit: number; offset: number }>(`/cub/users${qs ? `?${qs}` : ""}`, "GET");
};

export const cubSoftDeleteUser = async (userId: string) => {
  return http<{ user: { id: string; deleted_at: string | null } }>(`/cub/users/${userId}/soft-delete`, "PUT");
};

export const cubHardDeleteUser = async (userId: string, payload: { confirm_password: string }) => {
  return http<{ ok: boolean }>(`/cub/users/${userId}/hard-delete`, "POST", payload);
};

export const cubActivatePaidUser = async (userId: string) => {
  return http<{ user: { id: string; account_type: string | null; subscription_status: string | null; trial_ends_at: string | null } }>(
    `/cub/users/${userId}/activate-paid`,
    "PUT"
  );
};

// --------------------
// CUB internal: Incidents (placeholders)
// --------------------

export type CubIncidentSeverity = "low" | "medium" | "high" | "critical";
export type CubIncidentStatus = "open" | "in_progress" | "closed";

export type CubIncident = {
  id: string;
  opened_at: string;
  severity: CubIncidentSeverity;
  status: CubIncidentStatus;
  title: string;
  owner?: string | null;
  notes?: string | null;
  updated_at?: string | null;
};

export const getCubIncidents = async (args?: { status?: CubIncidentStatus; limit?: number; from?: string; to?: string }) => {
  const params = new URLSearchParams();
  if (args?.status) params.set("status", args.status);
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  if (args?.from) params.set("from", args.from);
  if (args?.to) params.set("to", args.to);
  const qs = params.toString();
  const res = await http<{ incidents: CubIncident[] }>(`/cub/incidents${qs ? `?${qs}` : ""}`, "GET");
  return res.incidents;
};

export const createCubIncident = async (payload: {
  title: string;
  severity: CubIncidentSeverity;
  owner?: string;
  notes?: string;
}) => {
  return http<{ incident: CubIncident }>(`/cub/incidents`, "POST", payload);
};

export const getCubAuditLogs = async (args?: { from?: string; to?: string; limit?: number }) => {
  const params = new URLSearchParams();
  if (args?.from) params.set("from", args.from);
  if (args?.to) params.set("to", args.to);
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  const qs = params.toString();
  const res = await http<{ logs: AuditLog[] }>(`/cub/audit-logs${qs ? `?${qs}` : ""}`, "GET");
  return res.logs;
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
// Mediation requests (parent -> mediator assignment request)
// --------------------
export type MediationRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type MediationRequest = {
  id: string;
  plan_id: string;
  requester_user_id: string;
  status: MediationRequestStatus;
  notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export const getMyMediationRequestForPlan = async (planId: string): Promise<MediationRequest | null> => {
  try {
    const res = await http<{ request: MediationRequest | null }>(`/plans/${planId}/mediation-request`, "GET");
    return res?.request ?? null;
  } catch {
    return null;
  }
};

export const createMyMediationRequestForPlan = async (
  planId: string,
  payload?: { notes?: string | null; target_mediator_id?: string | null; target_email?: string | null },
) => {
  const res = await http<{ request: MediationRequest }>(`/plans/${planId}/mediation-request`, "POST", {
    notes: payload?.notes ?? null,
    target_mediator_id: payload?.target_mediator_id ?? null,
    target_email: payload?.target_email ?? null,
  });
  return res?.request;
};

export const cancelMyMediationRequest = async (requestId: string) => {
  const res = await http<{ request: MediationRequest }>(`/plans/mediation-request/${requestId}`, "DELETE");
  return res?.request;
};

// --------------------
// Mediator directory (opt-in)
// --------------------
export type ListedMediator = {
  user_id: string;
  display_name: string;
  province: string | null;
  city: string | null;
  languages: string[];
  bio: string | null;
};

export const getMediatorDirectory = async (args?: { limit?: number }): Promise<ListedMediator[]> => {
  const params = new URLSearchParams();
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await http<{ mediators: ListedMediator[] }>(`/mediators/directory${qs}`, "GET");
  return res?.mediators ?? [];
};

export type MediatorProfile = {
  user_id: string;
  is_listed: boolean;
  display_name: string;
  province: string | null;
  city: string | null;
  languages: string[];
  bio: string | null;
  listed_at: string | null;
  updated_at: string | null;
};

export const getMyMediatorProfile = async (): Promise<MediatorProfile | null> => {
  const res = await http<{ profile: MediatorProfile | null }>(`/mediators/me`, "GET");
  return res?.profile ?? null;
};

export const upsertMyMediatorProfile = async (payload: Partial<{
  is_listed: boolean;
  display_name: string;
  province: string | null;
  city: string | null;
  languages: string[];
  bio: string | null;
}>) => {
  const res = await http<{ profile: MediatorProfile }>(`/mediators/me`, "PUT", payload);
  return res?.profile ?? null;
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
  content_type?: string;
  size_bytes?: number;
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
  options?: { includeDeleted?: boolean; limit?: number; before?: string }
) => {
  const params = new URLSearchParams();
  if (options?.includeDeleted) params.set("include_deleted", "true");
  if (typeof options?.limit === "number") params.set("limit", String(options.limit));
  if (options?.before) params.set("before", options.before);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await http<{ messages: ApiMessage[]; has_more?: boolean }>(
    `/messages/plan/${planId}${query}`,
    "GET"
  );
  return {
    messages: res.messages,
    hasMore: Boolean(res.has_more),
  };
};

export type SendMessagePayload = {
  sender_id: string;
  receiver_id: string;
  plan_id: string;
  content: string;
  purpose?: MessagePurpose;
  attachments?: Array<{
    name: string;
    type: AttachmentType;
    url: string;
    content_type?: string;
    size_bytes?: number;
  }>;
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
  status: "pending" | "approved" | "rejected" | "changes_requested";
  created_at: string;
  updated_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reviewed_notes?: string | null;
}

// --------------------
// Parent mediator shared artifacts
// --------------------

export type PlanMediator = {
  user_id: string;
  full_name: string;
  city?: string | null;
  province?: string | null;
  bio?: string | null;
};

export const getPlanMediators = async (planId: string): Promise<PlanMediator[]> => {
  const res = await http<{ mediators: PlanMediator[] }>(`/plans/${planId}/mediators`, "GET");
  return res.mediators ?? [];
};

export type SharedMediatorSession = {
  id: string;
  plan_id: string;
  starts_at: string;
  ends_at: string | null;
  visibility: "shared" | "mediator_only";
  mode: "in_person" | "online" | "phone" | "other";
  location: string | null;
  agenda: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

export const getSharedMediatorSessions = async (planId: string): Promise<SharedMediatorSession[]> => {
  const res = await http<{ sessions: SharedMediatorSession[] }>(`/plans/${planId}/shared-sessions`, "GET");
  return res.sessions ?? [];
};

export const getSharedSessionActionItems = async (planId: string, sessionId: string) => {
  const res = await http<{ items: MediatorSessionActionItem[] }>(
    `/plans/${planId}/shared-sessions/${sessionId}/action-items`,
    "GET",
  );
  return res.items ?? [];
};

export const getSharedCaseDocuments = async (planId: string): Promise<CaseDocument[]> => {
  const res = await http<{ documents: CaseDocument[] }>(`/plans/${planId}/shared-documents`, "GET");
  return res.documents ?? [];
};

export const getSharedCaseDocumentSignedUrl = async (planId: string, docId: string): Promise<string> => {
  const res = await http<{ signed_url: string; url: string }>(`/plans/${planId}/shared-documents/${docId}/signed-url`, "GET");
  return res.signed_url || res.url;
};

export type PlanDecision = {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewed_notes: string | null;
  reviewer_name: string | null;
};

export const getPlanDecisions = async (planId: string): Promise<PlanDecision[]> => {
  const res = await http<{ decisions: PlanDecision[] }>(`/plans/${planId}/decisions`, "GET");
  return res.decisions ?? [];
};

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

export const createMessageAttachmentSignedUpload = async (payload: {
  plan_id: string;
  receiver_id: string;
  filename: string;
  content_type: string;
}) => {
  return http<{ path: string; signed_url: string }>(
    "/messages/attachments/signed-upload",
    "POST",
    payload,
  );
};

export const getSignedMessageAttachmentUrl = async (id: string) => {
  const res = await http<{ url: string }>(`/messages/attachments/${id}/signed-url`, "GET");
  return res.url;
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

export const getProposals = async (status?: "pending" | "approved" | "rejected" | "changes_requested") => {
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
  payload: { status: "pending" | "approved" | "rejected" | "changes_requested"; reviewed_by?: string; notes?: string }
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

export type CubAccountMetrics = {
  accounts_total: number;
  by_status: {
    active: number;
    draft: number;
    archived: number;
  };
  plans_with_2_parents: number;
  plans_with_1_parent: number;
  plans_with_0_parents: number;
  plans_with_pending_invites: number;
};

export const getCubAccountMetrics = async (): Promise<CubAccountMetrics> => {
  const res = await http<{ metrics: CubAccountMetrics }>("/cub/metrics/accounts", "GET");
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

export interface ModeratorFlaggedMessage extends ApiMessage {
  sender_name?: string | null;
  receiver_name?: string | null;
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

export const getMyModeratorAssignedPlans = async (): Promise<Plan[]> => {
  const res = await http<{ plans: Plan[] }>("/admin/moderator/assigned-plans", "GET");
  return res?.plans ?? [];
};

export interface ModeratorAssignedPlanWithClients {
  id: string;
  title: string;
  clients: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
  stage?: MediatorCaseStage;
  legal_hold?: boolean | null;
  destruction_requested_at?: string | null;
  destruction_due_at?: string | null;
  redacted_at?: string | null;
  destruction_status?: string | null;
}

export const getMyModeratorAssignedPlansWithClients = async (): Promise<ModeratorAssignedPlanWithClients[]> => {
  // Backend currently returns this structure from the same endpoint used above.
  // Keep a dedicated helper for mediator pages that need clients grouped per plan.
  const res = await http<{ plans: ModeratorAssignedPlanWithClients[] }>("/admin/moderator/assigned-plans", "GET");
  return res?.plans ?? [];
};

export type MediatorCaseStage =
  | "intake"
  | "screening"
  | "onboarding"
  | "info_gathering"
  | "active_mediation"
  | "drafting"
  | "finalisation"
  | "follow_up"
  | "closed";

export const setMyMediatorCaseStage = async (planId: string, stage: MediatorCaseStage) => {
  const res = await http<{ stage: MediatorCaseStage }>(`/admin/moderator/cases/${planId}/stage`, "PUT", { stage });
  return res?.stage;
};

export type MediatorSessionMode = "in_person" | "online" | "phone" | "other";
export type ActionItemVisibility = "shared" | "mediator_only";
export type CaseDocumentVisibility = "shared" | "mediator_only";

export type MediatorSession = {
  id: string;
  plan_id: string;
  starts_at: string;
  ends_at: string | null;
  mode: MediatorSessionMode;
  location: string | null;
  agenda: string | null;
  outcome_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

export type MediatorSessionActionItem = {
  id: string;
  session_id: string;
  text: string;
  due_at: string | null;
  visibility: ActionItemVisibility;
  is_done: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

export const getMyMediatorSessions = async (args?: { plan_id?: string; from?: string; to?: string; limit?: number }) => {
  const params = new URLSearchParams();
  if (args?.plan_id) params.set("plan_id", args.plan_id);
  if (args?.from) params.set("from", args.from);
  if (args?.to) params.set("to", args.to);
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await http<{ sessions: MediatorSession[] }>(`/admin/moderator/sessions${qs}`, "GET");
  return res?.sessions ?? [];
};

export const createMyMediatorSession = async (payload: {
  plan_id: string;
  starts_at: string;
  ends_at?: string | null;
  mode?: MediatorSessionMode;
  location?: string | null;
  agenda?: string | null;
}) => {
  const res = await http<{ session: MediatorSession }>(`/admin/moderator/sessions`, "POST", payload);
  return res?.session;
};

export const updateMyMediatorSession = async (id: string, payload: Partial<{
  starts_at: string;
  ends_at: string | null;
  mode: MediatorSessionMode;
  location: string | null;
  agenda: string | null;
  outcome_notes: string | null;
}>) => {
  const res = await http<{ session: MediatorSession }>(`/admin/moderator/sessions/${id}`, "PUT", payload);
  return res?.session;
};

export const getMySessionActionItems = async (sessionId: string) => {
  const res = await http<{ items: MediatorSessionActionItem[] }>(`/admin/moderator/sessions/${sessionId}/action-items`, "GET");
  return res?.items ?? [];
};

export type MediatorSessionActionItemWithContext = MediatorSessionActionItem & {
  plan_id: string;
  session_starts_at: string;
};

export const getMyModeratorActionItems = async (args?: {
  plan_id?: string;
  due_from?: string;
  due_to?: string;
  include_done?: boolean;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (args?.plan_id) params.set("plan_id", args.plan_id);
  if (args?.due_from) params.set("due_from", args.due_from);
  if (args?.due_to) params.set("due_to", args.due_to);
  if (args?.include_done) params.set("include_done", "true");
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await http<{ items: MediatorSessionActionItemWithContext[] }>(`/admin/moderator/action-items${qs}`, "GET");
  return res?.items ?? [];
};

export const createMySessionActionItem = async (sessionId: string, payload: {
  text: string;
  due_at?: string | null;
  visibility?: ActionItemVisibility;
}) => {
  const res = await http<{ item: MediatorSessionActionItem }>(`/admin/moderator/sessions/${sessionId}/action-items`, "POST", payload);
  return res?.item;
};

export const updateMySessionActionItem = async (actionItemId: string, payload: Partial<{
  text: string;
  due_at: string | null;
  visibility: ActionItemVisibility;
  is_done: boolean;
}>) => {
  const res = await http<{ item: MediatorSessionActionItem }>(`/admin/moderator/action-items/${actionItemId}`, "PUT", payload);
  return res?.item;
};

export const getMyModeratorFlaggedMessages = async (options?: { includeDeleted?: boolean }) => {
  const params = new URLSearchParams();
  if (options?.includeDeleted) params.set("include_deleted", "true");
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await http<{ messages: ModeratorFlaggedMessage[] }>(`/admin/moderator/flagged-messages${query}`, "GET");
  return res?.messages ?? [];
};

export type MediationRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type MediationRequestWithContext = {
  id: string;
  plan_id: string;
  requester_user_id: string;
  status: MediationRequestStatus;
  notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string | null;
  plan_title: string | null;
  requester_name: string | null;
  requester_email: string | null;
};

export const getPendingMediationRequests = async (args?: { limit?: number }) => {
  const params = new URLSearchParams();
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await http<{ requests: MediationRequestWithContext[] }>(`/admin/moderator/requests${qs}`, "GET");
  return res?.requests ?? [];
};

export const acceptMediationRequest = async (id: string) => {
  const res = await http<{ request: { id: string } }>(`/admin/moderator/requests/${id}/accept`, "POST", {});
  return res?.request ?? null;
};

export const rejectMediationRequest = async (id: string) => {
  const res = await http<{ request: { id: string } }>(`/admin/moderator/requests/${id}/reject`, "POST", {});
  return res?.request ?? null;
};

export type CaseDocument = {
  id: string;
  plan_id: string;
  name: string;
  storage_path: string;
  content_type: string | null;
  visibility: CaseDocumentVisibility;
  version: number;
  is_deleted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

export type CaseScreeningOutcome =
  | "suitable"
  | "needs_more_info"
  | "paused_safety"
  | "unsuitable_refer";

export type CaseScreeningChecklist = {
  domestic_violence?: boolean;
  child_safety_risk?: boolean;
  substance_abuse?: boolean;
  coercive_control?: boolean;
  mental_health_concerns?: boolean;
  urgent_protection_needed?: boolean;
  interpreter_needed?: boolean;
};

export type CaseScreening = {
  plan_id: string;
  checklist: CaseScreeningChecklist;
  outcome: CaseScreeningOutcome;
  referral_outcome: string | null;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
};

export const getCaseScreening = async (planId: string) => {
  const res = await http<{ screening: CaseScreening | null }>(`/admin/moderator/cases/${planId}/screening`, "GET");
  return res?.screening ?? null;
};

export const upsertCaseScreening = async (
  planId: string,
  payload: {
    checklist: CaseScreeningChecklist;
    outcome: CaseScreeningOutcome;
    referral_outcome?: string | null;
    notes?: string | null;
  },
) => {
  const res = await http<{ screening: CaseScreening }>(`/admin/moderator/cases/${planId}/screening`, "PUT", payload);
  return res?.screening;
};

export type CaseFeedback = {
  id: string;
  plan_id: string;
  rating: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export const getCaseFeedback = async (planId: string, options?: { limit?: number }) => {
  const q = typeof options?.limit === "number" ? `?limit=${encodeURIComponent(String(options.limit))}` : "";
  const res = await http<{ items: CaseFeedback[] }>(`/admin/moderator/cases/${planId}/feedback${q}`, "GET");
  return res?.items ?? [];
};

export const createCaseFeedback = async (planId: string, payload: { rating?: number | null; notes?: string | null }) => {
  const res = await http<{ item: CaseFeedback }>(`/admin/moderator/cases/${planId}/feedback`, "POST", payload);
  return res?.item;
};

export const getCaseDocuments = async (planId: string) => {
  const res = await http<{ documents: CaseDocument[] }>(`/admin/moderator/cases/${planId}/documents`, "GET");
  return res?.documents ?? [];
};

export const createCaseDocumentSignedUpload = async (
  planId: string,
  payload: { filename: string; content_type?: string | null }
) => {
  const res = await http<{ signed_url: string; path: string }>(
    `/admin/moderator/cases/${planId}/documents/signed-upload`,
    "POST",
    payload
  );
  return res;
};

export const createCaseDocument = async (
  planId: string,
  payload: { name: string; storage_path: string; content_type?: string | null; visibility?: CaseDocumentVisibility }
) => {
  const res = await http<{ document: CaseDocument }>(`/admin/moderator/cases/${planId}/documents`, "POST", payload);
  return res?.document;
};

export const updateCaseDocument = async (id: string, payload: Partial<{ name: string; visibility: CaseDocumentVisibility }>) => {
  const res = await http<{ document: CaseDocument }>(`/admin/moderator/documents/${id}`, "PUT", payload);
  return res?.document;
};

export const deleteCaseDocument = async (id: string) => {
  const res = await http<{ document: CaseDocument }>(`/admin/moderator/documents/${id}`, "DELETE");
  return res?.document;
};

export const getCaseDocumentSignedUrl = async (id: string, options?: { expires_in?: number }) => {
  const q = typeof options?.expires_in === "number" ? `?expires_in=${encodeURIComponent(String(options.expires_in))}` : "";
  const res = await http<{ signed_url?: string; url?: string }>(`/admin/moderator/documents/${id}/signed-url${q}`, "GET");
  return res?.signed_url ?? res?.url ?? "";
};

export type CaseExportBundle = {
  generated_at: string;
  plan: {
    id: string;
    title: string | null;
    stage: MediatorCaseStage;
    legal_hold: boolean | null;
    destruction_requested_at: string | null;
    destruction_due_at: string | null;
    destruction_status: string | null;
    redacted_at: string | null;
  };
  participants: Array<{
    id: string;
    role: string | null;
    full_name: string | null;
    email: string | null;
  }>;
  documents: CaseDocument[];
  screening: CaseScreening | null;
  feedback: CaseFeedback[];
  messages: ApiMessage[];
};

export const getCaseExportBundle = async (planId: string) => {
  const res = await http<{ bundle: CaseExportBundle }>(`/admin/moderator/cases/${planId}/export-bundle`, "GET");
  return res?.bundle ?? null;
};

export const fetchAllPlanMessages = async (
  plans: { id: string }[],
  options?: { includeDeleted?: boolean }
): Promise<ApiMessage[]> => {
  const allMessages: ApiMessage[] = [];

  for (const plan of plans) {
    const { messages } = await getMessagesByPlan(plan.id, options);
    allMessages.push(...messages);
  }

  return allMessages;
};

