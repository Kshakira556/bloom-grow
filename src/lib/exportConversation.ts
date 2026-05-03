import jsPDF from "jspdf";
import { format } from "date-fns";
import { Message } from "@/types/messages";
import { ApiMessageHistory } from "@/lib/api";
import { getSenderName } from "@/lib/messages";

export type Conversation = {
  user_id: string;
  name: string;
  role: string;
  caseRef: string;
  childName?: string | null;
};

const formatDateTime = (value: string) =>
  format(new Date(value), "yyyy-MM-dd HH:mm");

const formatHistoryLabel = (entry: ApiMessageHistory) => {
  const when = formatDateTime(entry.action_at);

  switch (entry.action_type) {
    case "create":
      return `Original (${when})`;
    case "update":
      return `Edited (${when})`;
    case "delete":
      return `Deleted (${when})`;
    default:
      return `Event (${when})`;
  }
};

export const exportConversation = async (
  messages: Message[],
  conversation: Conversation,
  purposeFilter: string,
  historyByMessageId: Record<string, ApiMessageHistory[]> = {}
) => {
  const exportedMessages =
    purposeFilter === "All"
      ? messages
      : messages.filter((m) => m.purpose === purposeFilter);

  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(14);
  doc.text("Conversation Export", 10, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Exported: ${new Date().toLocaleString()}`, 10, y);
  y += 6;

  // Conversation header
  doc.text(`Participant: ${conversation.name}`, 10, y);
  y += 6;
  doc.text(`Role: ${conversation.role}`, 10, y);
  y += 6;
  doc.text(`Case: ${conversation.caseRef}`, 10, y);
  y += 6;
  if (conversation.childName) {
    doc.text(`Child: ${conversation.childName}`, 10, y);
    y += 6;
  }
  y += 4;

  doc.text(`Filter: ${purposeFilter}`, 10, y);
  y += 10;

  exportedMessages.forEach((msg, index) => {
    if (y > 270) {
      doc.addPage();
      y = 10;
    }

    const senderName = getSenderName(msg.sender, conversation);
    const recipientName = msg.sender === "me" ? conversation.name : "You";
    const historyEntries = historyByMessageId[msg.id] ?? [];
    const sortedHistory = historyEntries
      .slice()
      .sort((a, b) => new Date(a.action_at).getTime() - new Date(b.action_at).getTime());
    const isDeleted = sortedHistory.some((entry) => entry.action_type === "delete");

    doc.setFont(undefined, "bold");
    doc.text(
      `${index + 1}. [${formatDateTime(msg.createdAt)}] ${senderName} ? ${recipientName} (${msg.purpose})${
        isDeleted ? " [Deleted]" : ""
      }`,
      10,
      y
    );
    y += 6;

    doc.setFont(undefined, "normal");
    const currentLabel = isDeleted ? "Current (deleted)" : "Current";
    const lines = doc.splitTextToSize(`${currentLabel}: ${msg.content}`, 180);
    doc.text(lines, 10, y);
    y += lines.length * 5 + 4;

    msg.attachments?.forEach((att) => {
      doc.text(`Attachment: ${att.name} (${att.type})`, 14, y);
      y += 5;
    });

    if (sortedHistory.length > 0) {
      doc.setFont(undefined, "bold");
      doc.text("History", 12, y);
      y += 6;

      doc.setFont(undefined, "normal");
      sortedHistory.forEach((entry) => {
        if (y > 270) {
          doc.addPage();
          y = 10;
        }

        const labelLines = doc.splitTextToSize(formatHistoryLabel(entry), 180);
        doc.text(labelLines, 12, y);
        y += labelLines.length * 5;

        if (entry.content) {
          const contentLabel =
            entry.action_type === "create"
              ? "Original"
              : entry.action_type === "update"
              ? "Edited to"
              : entry.action_type === "delete"
              ? "Deleted content"
              : "Content";

          const contentLines = doc.splitTextToSize(
            `${contentLabel}: ${entry.content}`,
            176
          );
          doc.text(contentLines, 16, y);
          y += contentLines.length * 5;
        }

        y += 3;
      });
    }

    y += 4;
  });

  doc.save(`conversation-${conversation.user_id}.pdf`);
};















