import { useCallback } from "react";
import * as api from "@/lib/api";

export const useMessages = () => {
  const fetchByPlan = useCallback((planId: string) => {
    return api.getMessagesByPlan(planId);
  }, []);

  const send = useCallback((payload: {
    sender_id: string;
    receiver_id: string;
    plan_id: string;
    content: string;
  }) => {
    return api.sendMessage(payload);
  }, []);

  const markSeen = useCallback((id: string) => {
    return api.markMessageAsSeen(id);
  }, []);

  return {
    fetchByPlan,
    send,
    markSeen,
  };
};
