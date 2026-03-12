import * as api from "@/lib/api";
import type { ApiMessage, Plan, SafeUser } from "@/lib/api";

export const fetchAllPlanMessages = async (
  plans: Plan[],
  options?: { includeDeleted?: boolean }
): Promise<ApiMessage[]> => {
  if (!plans.length) return [];

  const messageSets = await Promise.all(
    plans.map((plan) => api.getMessagesByPlan(plan.id, options))
  );

  return messageSets.flat();
};

export const buildUserNameMap = (users: SafeUser[]) => {
  return users.reduce<Record<string, string>>((acc, user) => {
    acc[user.id] = user.full_name;
    return acc;
  }, {});
};
