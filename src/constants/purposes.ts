import { MessagePurpose } from "@/types/messages";

export const MESSAGE_PURPOSES: MessagePurpose[] = [
  "General",
  "Legal",
  "Medical",
  "Safety",
  "Emergency",
  "Financial",
];

export const PURPOSES: Array<MessagePurpose | "All"> = ["All", ...MESSAGE_PURPOSES];
