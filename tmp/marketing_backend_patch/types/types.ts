// types.ts
export type User = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: "parent" | "mediator" | "admin" | "cub_internal";
  phone?: string;
  account_type?: "trial" | "paid";
  trial_ends_at?: Date | null;
  subscription_status?: "trial" | "active" | "pending_payment" | "canceled";

  marketing_opt_in?: boolean;
  marketing_opt_in_at?: string | null;
  marketing_unsubscribed_at?: string | null;

  // POPIA: retention + deletion lifecycle
  deletion_requested_at?: string | null;
  deletion_scheduled_for?: string | null;
  deleted_at?: string | null;
  anonymized_at?: string | null;

  created_at?: string;
  updated_at?: string;
};

export const isTrialActive = (user: User): boolean => {
  const trialEndAt = resolveTrialEndsAt(user);
  if (!trialEndAt) return false;
  return new Date(trialEndAt) > new Date();
};

export type SafeUser = Omit<User, "password_hash">;

export type SafeUserResponse = SafeUser & {
  is_trial_active?: boolean;
  trial_ends_at?: Date | null;
  requires_payment?: boolean;
};

export const resolveTrialEndsAt = (user: User): Date | null => {
  if (user.trial_ends_at) {
    const endDate = new Date(user.trial_ends_at);
    return Number.isNaN(endDate.getTime()) ? null : endDate;
  }

  if (user.account_type !== "trial" || !user.created_at) return null;

  const createdAt = new Date(user.created_at);
  if (Number.isNaN(createdAt.getTime())) return null;

  return new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
};

export const toSafeUserResponse = (user: User): SafeUserResponse => {
  const trialEndsAt = resolveTrialEndsAt(user);
  const isPaid = user.subscription_status === "active";
  const isTrialActive = Boolean(trialEndsAt && trialEndsAt > new Date());
  const requiresPayment = user.role === "parent" && !isPaid && !isTrialActive;

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    account_type: user.account_type,
    subscription_status: user.subscription_status,
    created_at: user.created_at,
    updated_at: user.updated_at,
    is_trial_active: isTrialActive,
    trial_ends_at: trialEndsAt,
    requires_payment: requiresPayment,
  };
};

export type Visit = {
  id: string;
  plan_id: string;
  child_id: string;
  parent_id: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  status: "scheduled" | "completed" | "missed" | "cancelled";
  is_deleted: boolean;
  created_at: string;
};

export type UpdateVisitDTO = {
  plan_id?: string;
  child_id?: string;
  parent_id: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  notes?: string;
  status?: "scheduled" | "completed" | "missed" | "cancelled";
};
