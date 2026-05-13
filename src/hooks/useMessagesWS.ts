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
    if (!user?.id || !activePlan?.id) return;

    const wsBaseUrl = import.meta.env.VITE_WS_URL;

    if (!wsBaseUrl) return;

    try {
      // Cookie-based auth: backend authenticates the WS handshake via HttpOnly cookie.
      const ws = new WebSocket(`${wsBaseUrl}/messages/ws`);

      const handleMessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === "message_seen" && typeof data.message_id === "string") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === data.message_id
                ? { ...message, is_seen: true, status: "Read" }
                : message
            )
          );
          return;
        }

        if (data.type !== "new_message") return;

        const msg: ApiMessage = data.message;
        if (msg.plan_id !== activePlan?.id) return;

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;

          const mappedMsg = mapApiMessageToMessage(msg, userId);

          return [...prev, mappedMsg];
        });

        if (
          String(msg.receiver_id) === String(user.id) &&
          !msg.is_seen
        ) {
          try {
            await markSeen(msg.id);
          } catch {
            // ignore duplicate/stale seen updates
          }
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
    }, [user?.id, activePlan?.id, userId, markSeen, setMessages]);
};
