import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import FileSaver from "file-saver";
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
  format: "pdf" | "docx",
  historyByMessageId: Record<string, ApiMessageHistory[]> = {}
) => {
  const exportedMessages =
    purposeFilter === "All"
      ? messages
      : messages.filter((m) => m.purpose === purposeFilter);

  if (format === "pdf") {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(14);
    doc.text("Conversation Export", 10, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 10, y);
    y += 6;

    // Conversation header
    doc.text(`Participant: ${conversation.name}`, 10, y); y += 6;
    doc.text(`Role: ${conversation.role}`, 10, y); y += 6;
    doc.text(`Case: ${conversation.caseRef}`, 10, y); y += 6;
    if (conversation.childName) doc.text(`Child: ${conversation.childName}`, 10, y);
    y += 10;

    doc.text(`Filter: ${purposeFilter}`, 10, y);
    y += 10;

            exportedMessages.forEach((msg, index) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }

      const senderName = getSenderName(msg.sender, conversation) ?? "Unknown";
      const recipientName = (msg.sender === "me" ? conversation.name : "You") ?? "Unknown";
      const messagePurpose = msg.purpose ?? "";
      const historyEntries = historyByMessageId[msg.id] ?? [];
      const sortedHistory = historyEntries
        .slice()
        .sort((a, b) => new Date(a.action_at).getTime() - new Date(b.action_at).getTime());
      const isDeleted = sortedHistory.some((entry) => entry.action_type === "delete");

      doc.setFont("helvetica", "bold");
      doc.text(
        `${index + 1}. [${formatDateTime(msg.createdAt)}] ${senderName} ? ${recipientName} (${messagePurpose})${
          isDeleted ? " [Deleted]" : ""
        }`,
        10,
        y
      );
      y += 6;

      doc.setFont("helvetica", "normal");;
      const currentLabel = isDeleted ? "Current (deleted)" : "Current";
      const lines = doc.splitTextToSize(`${currentLabel}: ${msg.content}`, 180);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 4;

      msg.attachments?.forEach((att) => {
        doc.text(`Attachment: ${att.name} (${att.type})`, 14, y);
        y += 5;
      });

      if (sortedHistory.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("History", 12, y);
        y += 6;

        doc.setFont("helvetica", "normal");
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
  } else {
    // DOCX export
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ children: [new TextRun({ text: "Conversation Export", bold: true, size: 28 })] }),
            new Paragraph(`Exported: ${new Date().toLocaleString()}`),
            new Paragraph(`Participant: ${conversation.name}`),
            new Paragraph(`Role: ${conversation.role}`),
            new Paragraph(`Case: ${conversation.caseRef}`),
            ...(conversation.childName ? [new Paragraph(`Child: ${conversation.childName}`)] : []),
            new Paragraph(`Filter: ${purposeFilter}`),
            new Paragraph(" "),
            ...exportedMessages.flatMap((msg, index) => {
              const senderName = getSenderName(msg.sender, conversation) ?? "Unknown";
              const recipientName = (msg.sender === "me" ? conversation.name : "You") ?? "Unknown";
              const historyEntries = historyByMessageId[msg.id] ?? [];
              const sortedHistory = historyEntries
                .slice()
                .sort((a, b) => new Date(a.action_at).getTime() - new Date(b.action_at).getTime());
              const isDeleted = sortedHistory.some((entry) => entry.action_type === "delete");

              return [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${index + 1}. [${formatDateTime(msg.createdAt)}] ${senderName} ? ${recipientName} (${msg.purpose})${
                        isDeleted ? " [Deleted]" : ""
                      }`,
                      bold: true,
                    }),
                  ],
                }),
                new Paragraph(`${isDeleted ? "Current (deleted)" : "Current"}: ${msg.content}`),
                ...(msg.attachments || []).map((att) =>
                  new Paragraph(`Attachment: ${att.name} (${att.type})`)
                ),
                ...(sortedHistory.length > 0
                  ? [
                      new Paragraph({
                        children: [new TextRun({ text: "History", bold: true })],
                      }),
                      ...sortedHistory.flatMap((entry) => {
                        const contentLabel =
                          entry.action_type === "create"
                            ? "Original"
                            : entry.action_type === "update"
                            ? "Edited to"
                            : entry.action_type === "delete"
                            ? "Deleted content"
                            : "Content";

                        const blocks = [new Paragraph(formatHistoryLabel(entry))];
                        if (entry.content) {
                          blocks.push(new Paragraph(`${contentLabel}: ${entry.content}`));
                        }
                        return blocks;
                      }),
                    ]
                  : []),
                new Paragraph(" "),
              ];
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, `conversation-${conversation.user_id}.docx`);
  }
};















