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
  const res = await http<RegisterResponse>("/users/register", "POST", payload);
  if (!res) throw new Error("Registration failed");
  return res 
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await http<LoginResponse>("/auth/login", "POST", { email, password });
  if (!res) throw new Error("Login failed");
  return res
};

export const getUsers = async (): Promise<SafeUser[]> => {
  const res = await http<{ users: SafeUser[] }>("/users", "GET");
  if (!res) throw new Error("User not found");
  return res.users;
};

export const getUserByEmail = async (email: string) => {
  const res = await http<{ id: string; full_name: string; email: string }>(`/users/email/${email}`, "GET");
  if (!res) throw new Error("User not found");
  return res;
};

export const getModerators = async (): Promise<Moderator[]> => {
  const res = await http<{ moderators: Moderator[] }>("/admin/moderators", "GET");
  if (!res) throw new Error("Moderator not found");
  return res.moderators;
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
  first_name: string;
  last_name?: string;
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
  const res = await http<{ plans: Plan[] }>("/plans", "GET");
  if (!res) return { plans: [] }; 
  return res;
}

export interface CreatePlanPayload {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "draft" | "archived";
  created_by: string;
  child_ids?: string[];
}

export const createPlan = async (payload: CreatePlanPayload): Promise<Plan> => {
  const res = await http<Plan>("/plans", "POST", payload);
  if (!res) throw new Error("Cannot create plan");
  return res;
};

export const getPlanById = async (id: string): Promise<{ plan: FullPlan }> => {
  const res = await http<{ plan: FullPlan }>(`/plans/${id}`, "GET");
  if (!res) throw new Error("Plan not found")
  return res;
};

export const inviteToPlan = async (payload: PlanInvitePayload) => {
  return http("/plans/invite", "POST", payload);
};

export const acceptPlanInvite = async (inviteId: string) => {
  return http("/plans/accept", "POST", { invite_id: inviteId });
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
  const res = await http<{ success: boolean; data: ApiVisit[] }>(
    `/visits/plan/${planId}`,
    "GET"
  );
  if (!res) return { success: false, data: [] }; 
  return res;
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
  return res?.messages ?? []; // null-safe
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

  if (!res) throw new Error("Failed to send message"); // handle null
  return res.message;
};

export const markMessageAsSeen = async (id: string): Promise<ApiMessage> => {
  const res = await http<{ message: ApiMessage }>(
    `/messages/seen/${id}`,
    "PUT"
  );

  if (!res) throw new Error("Failed to mark message as seen"); // null-safe
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
  const res = await http<ApiJournalEntry>("/journal", "POST", payload);
  if (!res) throw new Error("Failed to create journal entry"); // handle null
  return res;
};

export const getJournalEntriesByChild = async (
  childId: string
): Promise<ApiJournalEntry[]> => {
  const res = await http<{ entries: ApiJournalEntry[] }>(
    `/journal/child/${childId}`,
    "GET"
  );
  return res?.entries ?? []; // null-safe
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

export const getChildById = async (id: string): Promise<Child> => {
  const res = await http<Child>(`/children/${id}`, "GET");
  if (!res) throw new Error("Failed to fetch child");
  return res;
};

// Update message
export const updateMessage = async (
  id: string,
  payload: Partial<{ content: string }>
): Promise<ApiMessage> => {
  const res = await http<{ message: ApiMessage }>(`/messages/${id}`, "PUT", payload);
  if (!res) throw new Error("Failed to update message"); // handle null
  return res.message;
};

// Delete message
export const deleteMessage = async (id: string): Promise<void> => {
  const res = await http<void>(`/messages/${id}`, "DELETE");
  if (res === null) throw new Error("Failed to delete message"); // handle null
  return;
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
  if (!res) return [];
  return res.contacts ?? [];
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
  const res = await http<{ review: ReviewHistory }>(
    "/moderation/reviews",
    "POST",
    payload
  );
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

// --------------------
// Vaults
// --------------------
export interface Vault {
  id: string;
  child_id: string;
  full_name: string;
  nickname?: string;
  dob?: string;
  id_passport_no?: string;
  home_address?: string;
  created_at: string;
  updated_at?: string;
}

export const createVault = async (payload: {
  child_id: string;
  full_name: string;
  nickname?: string;
  dob?: string;
  id_passport_no?: string;
  home_address?: string;
}) => {
  const res = await http<{ vault: Vault }>("/vaults", "POST", payload);
  return res?.vault ?? null;
};

export const getVaultByChild = async (childId: string) => {
  const res = await http<{ vault: Vault }>(`/vaults/${childId}`, "GET");
  return res?.vault ?? null;
};

export const updateVault = async (
  vaultId: string,
  payload: Partial<{
    child_id: string;
    full_name: string;
    nickname?: string;
    dob?: string;
    id_passport_no?: string;
    home_address?: string;
  }>
) => {
  const res = await http<{ vault: Vault }>(`/vaults/${vaultId}`, "PUT", payload);
  return res?.vault ?? null;
};

export const deleteVault = async (vaultId: string) => {
  return http<void>(`/vaults/${vaultId}`, "DELETE");
};

export interface VaultDiscovery {
  medical: { exists: boolean; id?: string };
  safety: { exists: boolean; id?: string };
  legal: { exists: boolean; id?: string };
  guardians: { exists: boolean; id?: string };
  emergency_contacts: { exists: boolean; id?: string };
  documents: { exists: boolean; id?: string };
}

export const getVaultDiscovery = async (vaultId: string) => {
  return http<VaultDiscovery>(`/vaults/${vaultId}/discovery`, "GET");
};

// Guardians
export interface Guardian {
  id: string;
  name: string;
  cell_no?: string;
  work_no?: string;
}

export const getGuardians = async (vaultId: string) => {
  const res = await http<{ guardians: Guardian[] }>(`/vaults/${vaultId}/guardians`, "GET");
  return res?.guardians ?? [];
};

export const createGuardian = async (
  vaultId: string,
  payload: { name: string; cell_no?: string; work_no?: string }
) => {
  return http<{ guardian: Guardian }>(`/vaults/${vaultId}/guardians`, "POST", payload);
};

export const updateGuardian = async (
  guardianId: string,
  payload: Partial<{ name: string; cell_no?: string; work_no?: string }>
) => {
  return http<{ guardian: Guardian }>(`/guardians/${guardianId}`, "PUT", payload);
};

export const deleteGuardian = async (guardianId: string) => {
  return http<void>(`/guardians/${guardianId}`, "DELETE");
};

// Legal custody
export interface LegalCustody {
  id: string;
  custody_type?: string;
  case_no?: string;
  valid_until?: string;
  contact_type?: string;
}

export const getLegalCustody = async (id: string) => {
  const res = await http<{ legal: LegalCustody }>(`/vaults/legal-custody/${id}`, "GET");
  return res?.legal ?? null;
};

export const createLegalCustody = async (
  vaultId: string,
  payload: Partial<LegalCustody>
) => {
  return http<{ legal: LegalCustody }>(`/vaults/${vaultId}/legal-custody`, "POST", payload);
};

export const updateLegalCustody = async (
  id: string,
  payload: Partial<LegalCustody>
) => {
  return http<{ legal: LegalCustody }>(`/vaults/legal-custody/${id}`, "PUT", payload);
};

export const deleteLegalCustody = async (id: string) => {
  return http<void>(`/vaults/legal-custody/${id}`, "DELETE");
};

// Medical
export interface MedicalRecord {
  id: string;
  blood_type?: string;
  allergies?: string;
  medication?: string;
  doctor?: string;
}

export const getMedical = async (id: string) => {
  const res = await http<{ medical: MedicalRecord }>(`/vaults/medical/${id}`, "GET");
  return res?.medical ?? null;
};

export const createMedical = async (vaultId: string, payload: Partial<MedicalRecord>) => {
  return http<{ medical: MedicalRecord }>(`/vaults/${vaultId}/medical`, "POST", payload);
};

export const updateMedical = async (id: string, payload: Partial<MedicalRecord>) => {
  return http<{ medical: MedicalRecord }>(`/vaults/medical/${id}`, "PUT", payload);
};

export const deleteMedical = async (id: string) => {
  return http<void>(`/vaults/medical/${id}`, "DELETE");
};

// Safety
export interface SafetyRecord {
  id: string;
  approved_pickup?: string;
  not_allowed_pickup?: string;
}

export const getSafety = async (id: string) => {
  const res = await http<{ safety: SafetyRecord }>(`/vaults/safety/${id}`, "GET");
  return res?.safety ?? null;
};

export const createSafety = async (vaultId: string, payload: Partial<SafetyRecord>) => {
  return http<{ safety: SafetyRecord }>(`/vaults/${vaultId}/safety`, "POST", payload);
};

export const updateSafety = async (id: string, payload: Partial<SafetyRecord>) => {
  return http<{ safety: SafetyRecord }>(`/vaults/safety/${id}`, "PUT", payload);
};

export const deleteSafety = async (id: string) => {
  return http<void>(`/vaults/safety/${id}`, "DELETE");
};

// Emergency contacts
export interface EmergencyContact {
  id: string;
  name: string;
  phone?: string;
}

export const getEmergencyContact = async (id: string) => {
  const res = await http<{ contact: EmergencyContact }>(`/vaults/emergency-contacts/${id}`, "GET");
  return res?.contact ?? null;
};

export const createEmergencyContact = async (
  vaultId: string,
  payload: { name: string; phone?: string }
) => {
  return http<{ contact: EmergencyContact }>(
    `/vaults/${vaultId}/emergency-contacts`,
    "POST",
    payload
  );
};

export const updateEmergencyContact = async (
  id: string,
  payload: Partial<EmergencyContact>
) => {
  return http<{ contact: EmergencyContact }>(`/vaults/emergency-contacts/${id}`, "PUT", payload);
};

export const deleteEmergencyContact = async (id: string) => {
  return http<void>(`/vaults/emergency-contacts/${id}`, "DELETE");
};

// Documents
export interface VaultDocument {
  id: string;
  name: string;
  file_url?: string;
  category?: string;
  subcategory?: string;
}

export const addDocument = async (
  vaultId: string,
  payload: { name: string; file_url?: string; category?: string; subcategory?: string }
) => {
  return http<{ document: VaultDocument }>(`/vaults/${vaultId}/documents`, "POST", payload);
};

export const getDocument = async (id: string) => {
  const res = await http<{ document: VaultDocument }>(`/vaults/documents/${id}`, "GET");
  return res?.document ?? null;
};

export const updateDocument = async (
  id: string,
  payload: Partial<VaultDocument>
) => {
  return http<{ document: VaultDocument }>(`/vaults/documents/${id}`, "PUT", payload);
};

export const deleteDocument = async (id: string) => {
  return http<void>(`/vaults/documents/${id}`, "DELETE");
};

// --------------------
// Children
// --------------------
export interface ChildPayload {
  first_name: string;
  last_name?: string;
  birth_date?: string;
  notes?: string;
}

export const createChild = async (payload: ChildPayload): Promise<Child> => {
  const res = await http<{ child: Child }>("/children", "POST", payload);
  if (!res?.child) throw new Error("Failed to create child");
  return res.child;
};

export const getChildren = async (): Promise<Child[]> => {
  const res = await http<{ children: Child[] }>("/children", "GET");
  return res?.children ?? [];
};

export const getChildByIdApi = async (id: string): Promise<Child> => {
  const res = await http<Child>(`/children/${id}`, "GET");
  if (!res) throw new Error("Child not found");
  return res;
};
