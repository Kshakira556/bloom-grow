import type { SafeUser } from "@/lib/api";

const parseTrialEnd = (trialEndsAt?: string | Date | null): Date | null => {
  if (!trialEndsAt) return null;
  const dateValue = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue;
};

export const requiresPaywall = (user?: SafeUser | null): boolean => {
  if (!user || user.role !== "parent") return false;

  if (typeof user.requires_payment === "boolean") {
    return user.requires_payment;
  }

  if (user.subscription_status === "active") return false;
  if (user.is_trial_active === true) return false;

  const trialEndDate = parseTrialEnd(user.trial_ends_at);
  if (trialEndDate) return trialEndDate.getTime() <= Date.now();

  return (
    user.account_type === "trial" ||
    user.subscription_status === "pending_payment" ||
    user.subscription_status === "canceled"
  );
};
