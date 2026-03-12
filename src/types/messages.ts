export type MessagePurpose =
  | "General"
  | "Legal"
  | "Medical"
  | "Safety"
  | "Emergency"
  | "Financial";

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
  updated_at?: string | null;
  purpose: MessagePurpose;
  status?: MessageStatus;
  attachments?: Attachment[];
};

export type DraftMessage = {
  content: string;
  purpose: MessagePurpose;
  attachments?: Attachment[];
};

