import { format, isToday, isYesterday } from "date-fns";
import { Message, MessagePurpose } from "@/types/messages";
import { useRef, useState, useLayoutEffect } from "react";
import Modal from "./Modal";

type Props = {
  messages: Message[];
  purposeFilter: MessagePurpose | "All";
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>; 
};

const MessageItem = ({ message, onEdit, onDelete }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleLongPressStart = () => {
    timerRef.current = setTimeout(() => {
      if (message.sender === "me") {
        // Instead of window.prompt, open modals
        setIsEditModalOpen(true);
        // You could add logic to choose delete modal as well if needed
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
          {/* Edit Button */}
          <button
            className="px-2 py-1 bg-cub-mint-light text-primary rounded hover:bg-cub-mint/70 transition"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit
          </button>

          <Modal
            isOpen={isEditModalOpen}
            title="Edit Message"
            onClose={() => setIsEditModalOpen(false)}
          >
            <textarea
              aria-label="Edit message"
              className="w-full p-2 border rounded mb-4"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-cub-mint-light text-primary hover:bg-cub-mint/70"
                onClick={() => {
                  if (editContent.trim()) onEdit(message.id, editContent.trim());
                  setIsEditModalOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </Modal>

          {/* Delete Button */}
          <button
            className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </button>

          <Modal
            isOpen={isDeleteModalOpen}
            title="Delete Message?"
            description="This action cannot be undone."
            onClose={() => setIsDeleteModalOpen(false)}
          >
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200"
                onClick={() => {
                  onDelete(message.id);
                  setIsDeleteModalOpen(false);
                }}
              >
                Delete
              </button>
            </div>
          </Modal>
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

const MessageList = ({ messages, purposeFilter, onEdit, onDelete, scrollContainerRef }: Props) => {
  const filtered =
    purposeFilter === "All"
      ? messages
      : messages.filter((m) => m.purpose === purposeFilter);

  const grouped = groupMessagesByDate(filtered);

  // Scroll only if a ref is provided
  useLayoutEffect(() => {
    if (!scrollContainerRef?.current) return;
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 10);
  }, [messages, scrollContainerRef]);

  return (
    <>
      {Object.entries(grouped).map(([dateLabel, msgs]) => (
        <div key={dateLabel}>
          <div className="text-center text-xs text-muted-foreground my-4">
            {dateLabel}
          </div>

          {msgs.map((msg, index) => (
            <MessageItem
              key={`${msg.id}-${dateLabel}-${index}`}
              message={msg}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </>
  );
};

export default MessageList;
