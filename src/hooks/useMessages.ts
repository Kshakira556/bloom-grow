import { useCallback } from "react";
import * as api from "@/lib/api";
import { ApiMessage } from "@/lib/api";

  type SendMessagePayload = {
  sender_id: string;
  receiver_id: string;
  plan_id: string;
  content: string;
};

export const useMessages = () => {
  const fetchByPlan = useCallback(
    async (planId: string): Promise<ApiMessage[]> => {
      return api.getMessagesByPlan(planId);
    },
    []
  );

const send = useCallback(
  async (payload: SendMessagePayload): Promise<ApiMessage> => {
    return api.sendMessage(payload);
  },
  []
);

  const markSeen = useCallback(
    async (id: string): Promise<ApiMessage> => {
      return api.markMessageAsSeen(id);
    },
    []
  );

  return {
    fetchByPlan,
    send,
    markSeen,
  };
};
