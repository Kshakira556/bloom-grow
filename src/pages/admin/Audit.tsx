import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Flag } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";

// Extend types for audit tracking
type MessagePurpose = "General" | "Legal" | "Medical" | "Safety" | "Emergency" | "Financial";

type Attachment = {
  id: string;
  name: string;
  type: string;
  url: string;
};

type Message = {
  id: number;
  senderId: string; // user ID
  senderName: string;
  recipientId: string;
  recipientName: string;
  text: string;
  time: string;
  purpose: MessagePurpose;
  attachments?: Attachment[];
  flagged?: boolean;
  edited?: { before: string; after: string };
  read?: boolean;
};

// Demo data for multiple users
const mockMessages: Message[] = [
  {
    id: 1,
    senderId: "parentA",
    senderName: "Parent A",
    recipientId: "parentB",
    recipientName: "Parent B",
    text: "Please remember to bring her school uniform tomorrow.",
    time: "13:56",
    purpose: "General",
    read: true,
  },
  {
    id: 2,
    senderId: "parentB",
    senderName: "Parent B",
    recipientId: "parentA",
    recipientName: "Parent A",
    text: "Noted. I’ll drop it off before 8am.",
    time: "13:59",
    purpose: "General",
    read: true,
    flagged: true,
  },
  {
    id: 3,
    senderId: "parentA",
    senderName: "Parent A",
    recipientId: "counselor",
    recipientName: "Child Counselor",
    text: "Here is the doctor’s note for Sophie.",
    time: "14:04",
    purpose: "Medical",
    attachments: [
      { id: "att-001", name: "Sophie_MedicalNote.pdf", type: "Medical Note", url: "/mock-files/Sophie_MedicalNote.pdf" },
    ],
    read: false,
  },
  {
    id: 4,
    senderId: "parentB",
    senderName: "Parent B",
    recipientId: "lawyer",
    recipientName: "Lawyer",
    text: "Received. Uploading the signed consent form.",
    time: "14:16",
    purpose: "Legal",
    attachments: [
      { id: "att-002", name: "ConsentForm_Signed.pdf", type: "Court Order", url: "/mock-files/ConsentForm_Signed.pdf" },
    ],
    read: true,
    edited: { before: "Uploading consent form.", after: "Received. Uploading the signed consent form." },
  },
];

const AdminAudit = () => {
  const [purposeFilter, setPurposeFilter] = useState<MessagePurpose | "All">("All");
    const [search, setSearch] = useState(""); // define search first

    const filteredMessages = (purposeFilter === "All"
      ? mockMessages
      : mockMessages.filter((msg) => msg.purpose === purposeFilter)
    ).filter((msg) =>
      msg.senderName.toLowerCase().includes(search.toLowerCase()) ||
      msg.recipientName.toLowerCase().includes(search.toLowerCase())
    );
  
  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Audit / Message History
        </h1>

        {/* Client Search Bar */}
        <Input
          placeholder="Search by sender or recipient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        {/* Filter */}
        <div className="flex gap-2">
          {(["All", "General", "Legal", "Medical", "Safety", "Emergency", "Financial"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPurposeFilter(p)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                purposeFilter === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs: (Case) Parent A</CardTitle>
            <button
              onClick={() => {
                const doc = new jsPDF();
                doc.setFontSize(12);
                doc.text(`Audit Logs: (Case) Parent A`, 10, 10);

                let y = 20;
                filteredMessages.forEach((msg, idx) => {
                  doc.text(
                    `${idx + 1}. [${msg.time}] ${msg.senderName} → ${msg.recipientName} (${msg.purpose})`,
                    10,
                    y
                  );
                  y += 7;
                  const lines = doc.splitTextToSize(msg.text, 180);
                  doc.text(lines, 10, y);
                  y += lines.length * 7 + 3;

                  if (msg.attachments?.length) {
                    msg.attachments.forEach(att => {
                      doc.text(`Attachment: ${att.name} (${att.type})`, 15, y);
                      y += 7;
                    });
                  }
                  if (y > 280) { doc.addPage(); y = 20; } // new page if overflow
                });

                doc.save(`ParentA_messages.pdf`);
              }}
              className="px-2 py-0.5 bg-primary text-white rounded text-xs hover:bg-primary/90"
            >
              Export
            </button>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <div key={msg.id} className="p-3 border rounded-xl flex flex-col gap-1">
                  {/* Header with sender, recipient, time, purpose, flagged */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{format(new Date(), "yyyy-MM-dd")} {msg.time}</span>
                    <span>{msg.senderName} → {msg.recipientName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary">{msg.purpose}</span>
                    {msg.flagged && <Flag className="w-4 h-4 text-red-500" title="Flagged message" />}
                    <span className={`ml-2 ${msg.read ? "text-green-600" : "text-gray-400"}`}>
                      {msg.read ? "Read" : "Unread"}
                    </span>
                  </div>

                  {/* Edited messages */}
                  {msg.edited ? (
                    <div className="text-xs text-orange-600 italic">
                      Edited: "{msg.edited.before}" → "{msg.edited.after}"
                    </div>
                  ) : null}

                  <p className="text-sm">{msg.text}</p>

                  {/* Attachments */}
                  {msg.attachments?.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {msg.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {att.name} ({att.type})
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No messages to display.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminAudit;
