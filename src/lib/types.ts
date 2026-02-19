// Conversation type used in Messages and ChatHeader
export type Conversation = {
  user_id: string;
  plan_id: string;
  name: string;
  role: string;
  topic: string;
  caseRef: string;
  childName: string | null;
  lastMessage: string;
  time: string;
  createdAt: string;
};

// Optional: If you want to share Message types too
export type MessageStatus = "Sent" | "Delivered" | "Read";
export type AttachmentType = "Document" | "Medical Note" | "Court Order" | "Report";

export type Attachment = {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
};

export type Message = {
  id: string;
  sender: "me" | "them";
  sender_id: string;
  receiver_id: string;
  content: string;
  time: string;
  createdAt: string;
  purpose: string; // could use MessagePurpose if you import it
  status?: MessageStatus;
  attachments?: Attachment[];
};

export type DraftMessage = {
  content: string;
  purpose: string; // could use MessagePurpose
  attachments?: Attachment[];
};
