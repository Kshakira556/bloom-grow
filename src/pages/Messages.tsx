import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Search, Send } from "lucide-react";
import { useState } from "react";

type MessagePurpose =
  | "General"
  | "Legal"
  | "Medical"
  | "Safety"
  | "Emergency";

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
  const [message, setMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);

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
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-lg">
                        {selectedConversation.name}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {selectedConversation.role}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Topic:</span>{" "}
                      {selectedConversation.topic}
                    </p>

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

                {/* Messages */}
                <div className="flex-1 p-6 space-y-4">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-xl ${
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

                        {/* Attachments (new) */}
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
                        <div className="mt-1 text-xs opacity-70 flex justify-between">
                          <span>{msg.time}</span>
                          {msg.sender === "me" && msg.status && (
                            <span className="italic">{msg.status}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input with guidance remains unchanged */}
                <div className="p-4 border-t flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 rounded-full"
                    />
                    <button
                      aria-label="Send message"
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground ${
                        message.trim() === "" ? "bg-muted cursor-not-allowed" : "bg-primary"
                      }`}
                      disabled={message.trim() === ""}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Guidance and character count */}
                  <div className="flex justify-between text-xs text-muted-foreground px-2">
                    <span>Type a clear, professional message.</span>
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
