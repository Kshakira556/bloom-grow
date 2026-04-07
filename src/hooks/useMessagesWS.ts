import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ApiMessage, FullPlan, SafeUser } from "@/lib/api";
import { mapApiMessageToMessage } from "@/lib/messages";
import type { Message } from "@/types/messages";

type Params = {
  user: SafeUser | null;
  activePlan: FullPlan | null;
  userId: string;
  markSeen: (id: string) => Promise<ApiMessage>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  selectedConversation: { user_id: string } | null;
};

export const useMessagesWS = ({
  user,
  activePlan,
  userId,
  markSeen,
  setMessages,
  selectedConversation,
}: Params) => {
  useEffect(() => {
    if (!user || !activePlan) return;
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const wsBaseUrl = import.meta.env.VITE_WS_URL;

    if (!wsBaseUrl) return;

    try {
      const ws = new WebSocket(`${wsBaseUrl}/messages/ws?token=${token}`);

      const handleMessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type !== "new_message") return;

        const msg: ApiMessage = data.message;
        if (msg.plan_id !== activePlan.id) return;

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;

          const mappedMsg = mapApiMessageToMessage(msg, userId);

          return [...prev, mappedMsg];
        });

        if (msg.receiver_id === user.id && !msg.is_seen) {
          await markSeen(msg.id);
        }
      };

      ws.addEventListener("message", handleMessage);

      return () => {
        ws.removeEventListener("message", handleMessage);
        ws.close();
      };
    } catch {
      // silent failure (prevents console noise)
    }
  }, [user, activePlan, userId, markSeen, setMessages, selectedConversation]);
};