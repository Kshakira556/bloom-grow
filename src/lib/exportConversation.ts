import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Message } from "@/types/messages";
import { getSenderName } from "@/lib/messages";

export type Conversation = {
  user_id: string;
  name: string;
  role: string;
  caseRef: string;
  childName?: string | null;
};

export const exportConversation = async (
  messages: Message[],
  conversation: Conversation,
  purposeFilter: string,
  format: "pdf" | "docx"
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

    exportedMessages.forEach((msg) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }

      doc.setFont(undefined, "bold");
      doc.text(
        `${msg.time} • ${getSenderName(msg.sender, conversation)} • ${msg.purpose}`,
        10,
        y
      );
      y += 6;

      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(msg.content, 180);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 4;

      msg.attachments?.forEach((att) => {
        doc.text(`• Attachment: ${att.name} (${att.type})`, 14, y);
        y += 5;
      });

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
            ...exportedMessages.flatMap((msg) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${msg.time} • ${getSenderName(msg.sender, conversation)} • ${msg.purpose}`,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph(msg.content),
              ...(msg.attachments || []).map((att) =>
                new Paragraph(`Attachment: ${att.name} (${att.type})`)
              ),
              new Paragraph(" "),
            ]),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `conversation-${conversation.user_id}.docx`);
  }
};
