import { format, isToday, isYesterday } from "date-fns";
import { Message } from "@/types/messages";
import { ApiMessage, FullPlan } from "@/lib/api";

export const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
  const groups: Record<string, Message[]> = {};

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);

    let key = format(msgDate, "MMM dd, yyyy");
    if (isToday(msgDate)) key = "Today";
    else if (isYesterday(msgDate)) key = "Yesterday";

    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  });

  return groups;
};

export const getSenderName = (sender: "me" | "them", selectedConversation: { name: string }) => {
  return sender === "me" ? "You" : selectedConversation.name;
};


export const mapApiMessageToMessage = (msg: ApiMessage, userId: string): Message => {
  return {
    id: msg.id,
    sender: msg.sender_id === userId ? "me" : "them",
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    content: msg.content,
    createdAt: msg.created_at,
    updated_at: msg.updated_at ?? null,
    time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    purpose: msg.purpose || "General",
    status: msg.is_seen ? "Read" : "Delivered",
    attachments: msg.attachments || [],
    is_flagged: msg.is_flagged,
    flagged_reason: msg.flagged_reason,
  };
};

type PlanInviteWithResolved = {
  id: string;
  plan_id: string;
  email: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  resolved_user_id?: number;
};

export const isUserParticipantOfPlan = (
  plan: FullPlan | null,
  userId: string
): boolean => {
  if (!plan) return false;

  const participantIds: string[] = [plan.created_by];

  if (plan.invites && plan.invites.length > 0) {
    (plan.invites as PlanInviteWithResolved[]).forEach((inv) => {
      if (inv.resolved_user_id) {
        participantIds.push(inv.resolved_user_id.toString());
      }
    });
  }

  return participantIds.includes(userId);
};
