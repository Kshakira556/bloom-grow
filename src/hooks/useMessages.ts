import { useCallback } from "react";
import * as api from "@/lib/api";
import { ApiMessage, SendMessagePayload } from "@/lib/api";
import { mapApiMessageToMessage } from "@/lib/messages";
import { Message } from "@/types/messages";

export const useMessages = () => {
  const fetchByPlan = useCallback(
    async (planId: string, userId: string): Promise<Message[]> => {
      const apiMessages = await api.getMessagesByPlan(planId);
      return apiMessages.map((msg) => mapApiMessageToMessage(msg, userId));
    },
    []
  );

  const send = useCallback(
    async (payload: SendMessagePayload): Promise<Message> => {
      // Send to backend and return the result only
      const apiMsg = await api.sendMessage(payload);
      return mapApiMessageToMessage(apiMsg, payload.sender_id);
    },
    []
  );

  const markSeen = useCallback(
    async (id: string): Promise<ApiMessage> => {
      return api.markMessageAsSeen(id);
    },
    []
  );

  const update = useCallback(
    async (id: string, content: string): Promise<ApiMessage> => {
      return api.updateMessage(id, { content });
    },
    []
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      return api.deleteMessage(id);
    },
    []
  );

  return {
    fetchByPlan,
    send,
    markSeen,
    update,
    remove,
  };
};
