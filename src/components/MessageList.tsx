import { format, isToday, isYesterday } from "date-fns";
import { Message, MessagePurpose } from "@/types/messages";
import { useRef } from "react";

type Props = {
  messages: Message[];
  purposeFilter: MessagePurpose | "All";
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
};

const MessageItem = ({ message, onEdit, onDelete }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = () => {
    timerRef.current = setTimeout(() => {
      if (message.sender === "me") {
        const action = window.prompt("Type 'edit' or 'delete'");
        if (action === "edit") {
          const newContent = window.prompt("Edit message:", message.content);
          if (newContent?.trim()) onEdit(message.id, newContent.trim());
        }
        if (action === "delete") {
          if (window.confirm("Delete this message?")) onDelete(message.id);
        }
      }
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      className={`mb-2 max-w-[70%] p-3 rounded-2xl break-words relative
        ${message.sender === "me" ? "ml-auto bg-primary text-white" : "mr-auto bg-gray-100 text-black"}`}
    >
      {/* Message content with purpose tag above text */}
      <div className="flex flex-col">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1
            ${message.sender === "me" ? "bg-primary/70 text-white" : "bg-gray-200 text-gray-600"}`}
        >
          {message.purpose}
        </span>
        <p className="break-words">{message.content}</p>
      </div>

      {/* Optional: edit/delete buttons for 'me' */}
      {message.sender === "me" && (
        <div className="flex gap-2 text-xs mt-1 justify-end">
          <button
            onClick={() => {
              const newContent = window.prompt("Edit message:", message.content);
              if (newContent?.trim()) onEdit(message.id, newContent.trim());
            }}
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm("Delete this message?")) onDelete(message.id);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

const groupMessagesByDate = (messages: Message[]) => {
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

const MessageList = ({ messages, purposeFilter, onEdit, onDelete }: Props) => {
  const filtered =
    purposeFilter === "All"
      ? messages
      : messages.filter((m) => m.purpose === purposeFilter);

  const grouped = groupMessagesByDate(filtered);

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {Object.entries(grouped).map(([dateLabel, msgs]) => (
        <div key={dateLabel}>
          {/* Date Header */}
          <div className="text-center text-xs text-muted-foreground my-4">
            {dateLabel}
          </div>

        {msgs.map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              onEdit={onEdit}
              onDelete={onDelete}
            />
        ))}

        </div>
      ))}
    </div>
  );
};

export default MessageList;
