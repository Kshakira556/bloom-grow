import { format, isToday, isYesterday } from "date-fns";
import MessageItem from "./MessageItem";
import { Message, MessagePurpose, Attachment } from "@/types/messages";

type Props = {
  messages: Message[];
  purposeFilter: MessagePurpose | "All";
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

const MessageList = ({ messages, purposeFilter }: Props) => {
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
            <MessageItem key={msg.id} message={msg} />
        ))}

        </div>
      ))}
    </div>
  );
};

export default MessageList;
