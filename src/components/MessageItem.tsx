import React from "react";
import { Message, Attachment } from "@/lib/types";

interface Props {
  message: Message;
}

const MessageItem: React.FC<Props> = ({ message }) => {
  const isMe = message.sender === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-xl relative break-words whitespace-pre-wrap ${
            isMe
                ? "bg-primary text-primary-foreground self-end"
                : "bg-muted text-muted-foreground self-start"
        }`}
      >
        {/* Purpose Tag */}
        {message.purpose && (
            <span className="mb-1 inline-block text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {message.purpose}
            </span>
        )}

        {/* Message Content */}
        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs underline"
              >
                📎 {file.name}
              </a>
            ))}
          </div>
        )}

        {/* Time & Status */}
        <div className="mt-1 text-xs opacity-70 flex justify-between items-center">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {isMe && message.status && (
            <span className="italic">{message.status}</span>
            )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
