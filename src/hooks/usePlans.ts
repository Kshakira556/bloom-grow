import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

const STORAGE_KEY = "active_plan_id";

export const usePlansQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: ["plans"],
    enabled,
    queryFn: async () => {
      const { plans } = await api.getPlans();
      return plans ?? [];
    },
  });
};

export const useActivePlanId = (plans: api.Plan[]) => {
  const [activePlanId, setActivePlanId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    if (!plans.length) {
      if (activePlanId) setActivePlanId("");
      return;
    }

    const exists = activePlanId && plans.some((p) => p.id === activePlanId);
    const next = exists ? activePlanId : plans[0]!.id;

    if (next !== activePlanId) setActivePlanId(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  return [activePlanId, setActivePlanId] as const;
};

export const useActivePlanQuery = (enabled: boolean, activePlanId: string) => {
  return useQuery({
    queryKey: ["plan", activePlanId],
    enabled: enabled && Boolean(activePlanId),
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { plan } = await api.getPlanById(activePlanId);
      return plan;
    },
  });
};

export const usePlanSelection = (enabled: boolean) => {
  const plansQuery = usePlansQuery(enabled);
  const plans = plansQuery.data ?? [];
  const [activePlanId, setActivePlanId] = useActivePlanId(plans);
  const activePlanQuery = useActivePlanQuery(enabled, activePlanId);

  const isLoading = plansQuery.isLoading || activePlanQuery.isLoading;

  const value = useMemo(
    () => ({
      plans,
      activePlanId,
      setActivePlanId,
      activePlan: activePlanQuery.data ?? null,
      isLoading,
      plansQuery,
      activePlanQuery,
    }),
    [plans, activePlanId, setActivePlanId, activePlanQuery.data, isLoading, plansQuery, activePlanQuery],
  );

  return value;
};

