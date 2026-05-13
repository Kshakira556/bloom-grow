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
  const hasContent = draft.content.trim().length > 0;
  const hasAttachments = (draft.attachments?.length ?? 0) > 0;
  const canSend = Boolean(selectedConversation?.user_id) && !disabled && (hasContent || hasAttachments);

  return (
    <div className="p-3 sm:p-4 border-t flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <select
          aria-label="Draft"
          value={draft.purpose}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              purpose: e.target.value as MessagePurpose,
            }))
          }
          className="rounded-full border px-3 py-2 text-xs sm:text-sm bg-muted w-auto min-w-[108px] sm:min-w-0"
        >
          {MESSAGE_PURPOSES.map((purpose) => (
            <option key={purpose} value={purpose}>
              {purpose}
            </option>
          ))}
        </select>

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
          className="cursor-pointer px-3 py-2 h-10 inline-flex items-center bg-secondary rounded-full text-xs sm:text-sm hover:bg-secondary/80 whitespace-nowrap"
        >
          Attach
        </label>
      </div>

      <div className="flex items-center gap-2 w-full">
        <Input
          type="text"
          placeholder="Type a message..."
          value={draft.content}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              content: e.target.value,
            }))
          }
          dir="ltr"
          autoComplete="off"
          className="flex-1 rounded-full"
        />

        <button
          key={draft.purpose + selectedConversation?.user_id}
          aria-label="Send message"
          className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground ${
            !canSend
              ? "bg-muted cursor-not-allowed"
              : "bg-primary"
          }`}
          disabled={!canSend}
          onClick={onSend}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {hasAttachments && (
        <div className="flex flex-wrap gap-2 px-1">
          {(draft.attachments || []).map((file) => (
            <div
              key={file.id}
              className="inline-flex items-center gap-2 rounded-full border bg-secondary/60 px-3 py-1 text-xs"
            >
              <span className="max-w-[180px] truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    attachments: (prev.attachments || []).filter((att) => att.id !== file.id),
                  }))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Guidance and character count */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>Type a clear, professional message.</span>
        <span>{draft.content.length} / 500</span>
      </div>
    </div>
  );
};

export default MessageInput;
