import React from "react";
import { Message } from "@/types/messages";
import { getSignedMessageAttachmentUrl } from "@/lib/api";
import { toast } from "@/lib/toastHelper";

interface Props {
  message: Message;
}

const MessageItem: React.FC<Props> = ({ message }) => {
  const isMe = message.sender === "me";

  const openAttachment = async (attachment: { id: string; url: string; name: string }) => {
    try {
      const rawUrl = attachment.url || "";

      if (rawUrl.startsWith("blob:") || rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        window.open(rawUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const signedUrl = await getSignedMessageAttachmentUrl(attachment.id);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        title: "Failed to open attachment",
        description: err instanceof Error ? err.message : "Unable to open attachment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-xl relative break-words whitespace-pre-wrap ${
          isMe
            ? "bg-primary text-primary-foreground self-end"
            : "bg-muted text-muted-foreground self-start"
        }`}
      >
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1 inline-block ${
            isMe ? "bg-primary/70 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {message.purpose}
        </span>

        <div className="text-sm whitespace-pre-wrap">{message.content}</div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => void openAttachment({ id: file.id, url: file.url, name: file.name })}
                className="block text-xs underline text-left"
              >
                📎 {file.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-1 text-xs opacity-70 flex justify-between items-center">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {isMe && message.status && <span className="italic">{message.status}</span>}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
