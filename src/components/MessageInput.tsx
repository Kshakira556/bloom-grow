import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import React from "react";
import { DraftMessage, MessagePurpose, AttachmentType } from "@/types/messages";
import { MESSAGE_PURPOSES } from "@/constants/purposes";

type Props = {
  draft: DraftMessage;
  setDraft: React.Dispatch<React.SetStateAction<DraftMessage>>;
  onSend: () => void;
  disabled?: boolean;
  selectedConversation: { user_id: string } | null;
};

const MessageInput: React.FC<Props> = ({
  draft,
  setDraft,
  onSend,
  disabled = false,
  selectedConversation,
}) => {
  return (
    <div className="p-4 border-t flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* Purpose selector */}
        <select
          aria-label="Draft"
          value={draft.purpose}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              purpose: e.target.value as MessagePurpose,
            }))
          }
          className="rounded-full border px-3 py-1 text-sm bg-muted"
        >
          {MESSAGE_PURPOSES.map((purpose) => (
            <option key={purpose} value={purpose}>
              {purpose}
            </option>
          ))}
        </select>

        {/* Text input */}
        <Input
          placeholder="Type a message..."
          value={draft.content}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              content: e.target.value,
            }))
          }
          className="flex-1 rounded-full"
        />

        {/* Attachment uploader */}
        <input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []).map((file, idx) => ({
              id: `att-${Date.now()}-${idx}`,
              name: file.name,
              type: "Document" as AttachmentType,
              url: URL.createObjectURL(file),
            }));

            setDraft((prev) => ({
              ...prev,
              attachments: [...(prev.attachments || []), ...files],
            }));
          }}
          className="hidden"
          id="file-upload"
        />

        <label
          htmlFor="file-upload"
          className="cursor-pointer px-3 py-2 bg-secondary rounded-full text-sm hover:bg-secondary/80"
        >
          Attach
        </label>

        {/* Send button */}
        <button
          key={draft.purpose + selectedConversation?.user_id}
          aria-label="Send message"
          className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground ${
            draft.content.trim() === "" || !selectedConversation?.user_id
              ? "bg-muted cursor-not-allowed"
              : "bg-primary"
          }`}
          disabled={draft.content.trim() === "" || !selectedConversation?.user_id}
          onClick={onSend}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Guidance and character count */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>Type a clear, professional message.</span>
        <span>{draft.content.length} / 500</span>
      </div>
    </div>
  );
};

export default MessageInput;
