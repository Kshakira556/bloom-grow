import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Search, Send } from "lucide-react";
import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

const groupMessagesByDate = (messages: Message[]) => {
  const groups: Record<string, Message[]> = {};
  messages.forEach((msg) => {
    const date = new Date();
    // For demonstration, assume all messages are today; replace with msg.date if available
    const msgDate = new Date();
    let key = format(msgDate, "yyyy-MM-dd");

    if (isToday(msgDate)) key = "Today";
    else if (isYesterday(msgDate)) key = "Yesterday";
    else key = format(msgDate, "MMM dd, yyyy");

    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  });
  return groups;
};

type MessagePurpose =
  | "General"
  | "Legal"
  | "Medical"
  | "Safety"
  | "Emergency"
  | "Financial";

type MessageStatus = "Sent" | "Delivered" | "Read";

type AttachmentType = "Document" | "Medical Note" | "Court Order" | "Report";

type Attachment = {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
};

type Message = {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  purpose: MessagePurpose;
  status?: MessageStatus;
  attachments?: Attachment[]; 
};

type DraftMessage = {
  text: string;
  purpose: MessagePurpose; 
  attachments?: Attachment[];
};

const mockMessages: Message[] = [
  {
    id: 1,
    sender: "them",
    text: "Please remember to bring her school uniform tomorrow.",
    time: "13:56",
    purpose: "General",
    status: "Delivered",
  },
  {
    id: 2,
    sender: "me",
    text: "Noted. I’ll drop it off before 8am.",
    time: "13:59",
    purpose: "General",
    status: "Read",
  },
  {
    id: 3,
    sender: "them",
    text: "Here is the doctor’s note for Sophie.",
    time: "14:04",
    purpose: "Medical",
    status: "Delivered",
    attachments: [
      {
        id: "att-001",
        name: "Sophie_MedicalNote.pdf",
        type: "Medical Note",
        url: "/mock-files/Sophie_MedicalNote.pdf",
      },
    ],
  },
  {
    id: 4,
    sender: "me",
    text: "Received. Uploading the signed consent form.",
    time: "14:16",
    purpose: "Legal",
    status: "Sent",
    attachments: [
      {
        id: "att-002",
        name: "ConsentForm_Signed.pdf",
        type: "Court Order",
        url: "/mock-files/ConsentForm_Signed.pdf",
      },
    ],
  },
];

const conversations = [
  {
    id: 1,
    name: "Parent B",
    role: "Co-Parent",
    topic: "School Pickup Schedule",
    caseRef: "Parenting Plan 2025",
    childName: "Sophie",
    lastMessage: "The message preview",
    time: "13:56",
    createdAt: "2026-01-07",
  },
  {
    id: 2,
    name: "Child Counselor",
    role: "Professional",
    topic: "Wellbeing Check-in",
    caseRef: "Counseling Notes",
    childName: "Sophie",
    lastMessage: "The message preview",
    time: "",
    createdAt: "2026-01-05",
  },
  {
    id: 3,
    name: "Lawyer",
    role: "Legal",
    topic: "Consent Documentation",
    caseRef: "Court Order #A482",
    childName: null,
    lastMessage: "The message preview",
    time: "",
    createdAt: "2026-01-03",
  },
];

const Messages = () => {
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [purposeFilter, setPurposeFilter] = useState<MessagePurpose | "All">("All");
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [draft, setDraft] = useState<DraftMessage>({
    text: "",
    purpose: "General",
    attachments: [],
  });

  const getSenderName = (sender: "me" | "them") => {
    return sender === "me" ? "You" : selectedConversation.name;
  };

  const exportConversationPDF = () => {
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
    doc.text(`Participant: ${selectedConversation.name}`, 10, y);
    y += 6;
    doc.text(`Role: ${selectedConversation.role}`, 10, y);
    y += 6;
    doc.text(`Case: ${selectedConversation.caseRef}`, 10, y);
    y += 6;

    if (selectedConversation.childName) {
      doc.text(`Child: ${selectedConversation.childName}`, 10, y);
      y += 6;
    }

    doc.text(`Filter: ${purposeFilter}`, 10, y);
    y += 10;

    exportedMessages.forEach((msg) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }

      doc.setFont(undefined, "bold");
      doc.text(
        `${msg.time} • ${getSenderName(msg.sender)} • ${msg.purpose}`,
        10,
        y
      );
      y += 6;

      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(msg.text, 180);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 4;

      msg.attachments?.forEach((att) => {
        doc.text(`• Attachment: ${att.name} (${att.type})`, 14, y);
        y += 5;
      });

      y += 4;
    });

    doc.save(`conversation-${selectedConversation.id}.pdf`);
  };

  const exportConversationDOCX = async () => {
    const exportedMessages =
      purposeFilter === "All"
        ? messages
        : messages.filter((m) => m.purpose === purposeFilter);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Conversation Export",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph(`Exported: ${new Date().toLocaleString()}`),
            new Paragraph(`Participant: ${selectedConversation.name}`),
            new Paragraph(`Role: ${selectedConversation.role}`),
            new Paragraph(`Case: ${selectedConversation.caseRef}`),
            ...(selectedConversation.childName
              ? [new Paragraph(`Child: ${selectedConversation.childName}`)]
              : []),
            new Paragraph(`Filter: ${purposeFilter}`),
            new Paragraph(" "),
            ...exportedMessages.flatMap((msg) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${msg.time} • ${getSenderName(msg.sender)} • ${msg.purpose}`,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph(msg.text),
              ...(msg.attachments || []).map(
                (att) =>
                  new Paragraph(`Attachment: ${att.name} (${att.type})`)
              ),
              new Paragraph(" "),
            ]),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `conversation-${selectedConversation.id}.docx`);
  };

  const exportConversation = (format: "pdf" | "docx") => {
    if (format === "pdf") exportConversationPDF();
    else exportConversationDOCX();
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6">
            Messages
          </h1>

          <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-12">
              {/* Sidebar */}
              <div className="md:col-span-4 border-r">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts"
                      className="pl-9 rounded-full bg-cub-mint-light border-0"
                    />
                  </div>
                </div>

                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 rounded-2xl text-left transition-all ${
                        selectedConversation.id === conv.id
                          ? "bg-cub-mint-light"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <p className="font-display font-bold">{conv.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="md:col-span-8 flex flex-col min-h-[500px]">
                {/* Conversation Context Header */}
                <div className="border-b px-6 py-4 bg-muted/30">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display font-bold text-lg">
                          {selectedConversation.name}
                        </h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {selectedConversation.role}
                        </span>
                      </div>

                      <button onClick={() => exportConversation("pdf")}>Export PDF</button>
                      <button onClick={() => exportConversation("docx")}>Export DOCX</button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {(["All", "General", "Legal", "Medical", "Safety", "Emergency", "Financial"] as const).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setPurposeFilter(p)}
                            className={`text-xs px-3 py-1 rounded-full border transition ${
                              purposeFilter === p
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                      <span>
                        <strong>Case:</strong> {selectedConversation.caseRef}
                      </span>

                      {selectedConversation.childName && (
                        <span>
                          <strong>Child:</strong>{" "}
                          {selectedConversation.childName}
                        </span>
                      )}

                      <span>
                        <strong>Started:</strong>{" "}
                        {new Date(
                          selectedConversation.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs italic text-muted-foreground mt-2">
                      This conversation is part of a structured and auditable
                      communication record.
                    </p>
                  </div>
                </div>
                
                {/* Audit & Oversight Banner */}
                <div className="w-full bg-red-100 border-l-4 border-red-500 text-red-700 px-6 py-2 mt-2 text-sm">
                  ⚠️ This conversation is logged and auditable for mediation purposes.
                </div>

                {/* Trust & Purpose Banner */}
                <div className="w-full bg-cub-mint-light border-l-4 border-primary text-primary px-6 py-2 mt-2 mb-4 text-sm font-medium rounded-r-lg shadow-sm">
                  💬 Communication here is structured, auditable, and linked to parenting plans.
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                  {Object.entries(
                    groupMessagesByDate(
                      purposeFilter === "All"
                        ? messages
                        : messages.filter((m) => m.purpose === purposeFilter)
                    )
                  ).map(([dateLabel, msgs]) => (
                    <div key={dateLabel}>
                      {/* Date Header */}
                      <div className="text-center text-xs text-muted-foreground my-4">
                        {dateLabel}
                      </div>

                      {/* Messages */}
                      {msgs.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-xl relative break-words whitespace-pre-wrap ${
                              msg.sender === "me"
                                ? "bg-primary text-primary-foreground self-end"
                                : "bg-muted text-muted-foreground self-start"
                            }`}
                          >
                            {/* Purpose Tag */}
                            <span className="mb-1 inline-block text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {msg.purpose}
                            </span>

                            {/* Message Text */}
                            <p className="mt-1">{msg.text}</p>

                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.attachments.map((att) => (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 border rounded text-sm hover:bg-muted/20"
                                  >
                                    <span className="font-medium">{att.name}</span>
                                    <span className="px-1 py-0.5 text-xs bg-secondary rounded">
                                      {att.type}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Time + Status */}
                            <div className="mt-1 text-xs opacity-70 flex justify-between items-center">
                              <span>{msg.time}</span>
                              {msg.sender === "me" && msg.status && (
                                <span className="italic">{msg.status}</span>
                              )}

                              {/* Flag Button */}
                              <button
                                onClick={() => console.log("Flagged message ID:", msg.id)}
                                className="ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 transition"
                                title="Flag message"
                              >
                                ⚑ Flag
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Input with guidance remains unchanged */}
                <div className="p-4 border-t flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    {/* Purpose selector */}
                    <select
                      aria-label="Draft"
                      value={draft.purpose}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, purpose: e.target.value as MessagePurpose }))
                      }
                      className="rounded-full border px-3 py-1 text-sm bg-muted"
                    >
                      <option value="General">General</option>
                      <option value="Legal">Legal</option>
                      <option value="Medical">Medical</option>
                      <option value="Safety">Safety</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Financial">Financial</option>
                    </select>

                    {/* Text input */}
                    <Input
                      placeholder="Type a message..."
                      value={draft.text}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, text: e.target.value }))
                      }
                      className="flex-1 rounded-full"
                    />

                    {/* Optional attachment uploader */}
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).map((file, idx) => ({
                          id: `att-${Date.now()}-${idx}`,
                          name: file.name,
                          type: "Document" as AttachmentType, // simplify for now
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
                      className="cursor-pointer px-3 py-2 bg-secondary rounded-full text-sm hover:bg-secondary/80"
                    >
                      Attach
                    </label>

                    {/* Send button */}
                    <button
                      aria-label="Send message"
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground ${
                        draft.text.trim() === "" ? "bg-muted cursor-not-allowed" : "bg-primary"
                      }`}
                      disabled={draft.text.trim() === ""}
                      onClick={() => {
                        const newMsg: Message = {
                          id: Date.now(),
                          sender: "me",
                          text: draft.text,
                          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                          purpose: draft.purpose,
                          status: "Sent",
                          attachments: draft.attachments,
                        };

                        setMessages((prev) => [...prev, newMsg]);
                        setDraft({ text: "", purpose: "General", attachments: [] });
                      }}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Guidance and character count */}
                  <div className="flex justify-between text-xs text-muted-foreground px-2">
                    <span>Type a clear, professional message.</span>
                    <span>{draft.text.length} / 500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
