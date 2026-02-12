import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Search, Send, Check } from "lucide-react";
import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useEffect } from "react";
import * as api from "@/lib/api";
import { ApiMessage } from "@/lib/api";
import { toast } from "@/lib/toastHelper";

type PlanInviteWithResolved = api.PlanInvite & {
  resolved_user_id?: number;
};

type Conversation = {
  user_id: string;
  plan_id: string;
  name: string;
  role: string;
  topic: string;
  caseRef: string;
  childName: string | null;
  lastMessage: string;
  time: string;
  createdAt: string;
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
  id: string;
  sender: "me" | "them";
  sender_id: string;       
  receiver_id: string;     
  content: string;
  time: string;
  createdAt: string;
  purpose: MessagePurpose;
  status?: MessageStatus;
  attachments?: Attachment[];
};

type DraftMessage = {
  content: string;
  purpose: MessagePurpose; 
  attachments?: Attachment[];
};

const Messages = () => {
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [purposeFilter, setPurposeFilter] = useState<MessagePurpose | "All">("All");
  const [draft, setDraft] = useState<DraftMessage>({
    content: "",
    purpose: "General",
    attachments: [],
  });

  const getSenderName = (sender: "me" | "them") => {
    return sender === "me" ? "You" : selectedConversation.name;
  };

  const exportConversationPDF = () => {
    if (!selectedConversation) return;
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
      const lines = doc.splitTextToSize(msg.content, 180);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 4;

      msg.attachments?.forEach((att) => {
        doc.text(`• Attachment: ${att.name} (${att.type})`, 14, y);
        y += 5;
      });

      y += 4;
    });

    doc.save(`conversation-${selectedConversation.user_id}.pdf`);
  };

  const exportConversationDOCX = async () => {
    if (!selectedConversation) return;
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
              new Paragraph(msg.content),
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
    saveAs(blob, `conversation-${selectedConversation.user_id}.docx`);
  };

  const exportConversation = (format: "pdf" | "docx") => {
    if (format === "pdf") exportConversationPDF();
    else exportConversationDOCX();
  };

  const { user } = useAuth();
  const userIdStr = user?.id.toString(); 
  const { fetchByPlan, send, markSeen } = useMessages();

    useEffect(() => {
      const fetchPlans = async () => {
        try {
          // ✅ Destructure the returned object
          const { plans } = await api.getPlans(); 
          setPlans(plans);

          if (plans[0]) {
            // ✅ Destructure plan from API response
            const { plan: fullPlan } = await api.getPlanById(plans[0].id); 
            setActivePlan(fullPlan);

            // ✅ Make sure user_id is a number
            // Resolve the user full_name for the first invite
            let name = "Co-Parent";
            let childName = null;

            if (fullPlan.invites && fullPlan.invites.length > 0) {
              const inviteEmail = fullPlan.invites[0].email;

              try {
                const allUsers = await api.getUsers(); // GET /api/users
                const matchedUser = allUsers.find(u => u.email === inviteEmail);
                name = matchedUser?.full_name || inviteEmail;
              } catch (err) {
                console.error("Failed to resolve invite user full_name:", err);
                name = fullPlan.invites[0].email; // fallback
              }

              childName = null; // fallback            
              }

            setSelectedConversation({
              user_id: fullPlan.created_by,
              plan_id: fullPlan.id,
              name,
              role: "Co-Parent",
              topic: "Plan conversation",
              caseRef: fullPlan.title,
              childName,
              lastMessage: "",
              time: "",
              createdAt: fullPlan.created_at,
            });

          }
        } catch (err) {
          console.error("Failed to load plans:", err);
        }
      };

      fetchPlans();
    }, []);

    interface PlanInvite {
      id: string;
      plan_id: string;
      email: string;
      status: "pending" | "accepted" | "declined";
      created_at: string;
      resolved_user_id?: number; 
    }

    useEffect(() => {
      if (!user) return;

      const token = localStorage.getItem("token"); 
      const ws = new WebSocket(
        `ws://localhost:8000/api/messages/ws?token=${token}`
      );

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "new_message") {
          const msg = data.message;

          // 1️⃣ Update chat messages
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;

            return [
              ...prev,
              {
                id: msg.id,
                sender: msg.sender_id === user.id ? "me" : "them",
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                content: msg.content,
                createdAt: msg.created_at,
                time: new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                purpose: "General",
                status: msg.is_seen ? "Read" : "Delivered",
                attachments: [],
              },
            ];
          });

          // 2️⃣ ✅ UPDATE SIDEBAR CONVERSATION PREVIEW (THIS IS THE FIX)
          setConversations(prev =>
            prev.map(c =>
              c.user_id === msg.sender_id ||
              c.user_id === msg.receiver_id
                ? {
                    ...c,
                    lastMessage: msg.content,
                    time: new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }
                : c
            )
          );

          // 3️⃣ Mark as seen if needed
          if (msg.receiver_id === user.id && !msg.is_seen) {
            await markSeen(msg.id);
          }
        }
      };

      return () => ws.close();
    }, [user]);

  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);
  const [conversations, setConversations] = useState<
    Array<{
      user_id: string;
      plan_id: string;
      name: string;
      role: string;
      topic: string;
      caseRef: string;
      childName: string | null;
      lastMessage: string;
      time: string;
      createdAt: string;
    }>
  >([]);

  const [invitesResolved, setInvitesResolved] = useState(false);

useEffect(() => {
  if (!activePlan || !activePlan.invites || invitesResolved) return;

  const fetchAllUsers = async () => {
    try {
      const allUsers = await api.getUsers();
      const updatedInvites = (activePlan.invites as PlanInviteWithResolved[]).map((inv) => {
        const user = allUsers.find(u => u.email === inv.email);
        return user ? { ...inv, resolved_user_id: user.id } : inv;
      });

      setActivePlan({ ...activePlan, invites: updatedInvites });
      setInvitesResolved(true);
    } catch (err) {
      console.error("Failed to fetch users to resolve invites:", err);
    }
  };

  fetchAllUsers();
}, [activePlan, invitesResolved]);

  const [selectedConversation, setSelectedConversation] = useState<{
    user_id: string; 
    plan_id: string; 
    name: string;
    role: string;
    topic: string;
    caseRef: string;
    childName: string | null;
    lastMessage: string;
    time: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    if (!activePlan || !user) return;

    const fetchMessages = async () => {
      try {
        const apiMessages = await fetchByPlan(activePlan.id);

        if (apiMessages.length === 0) {
          console.log("No messages started for this plan yet.");
        }

        const mapped: Message[] = apiMessages.map((m: ApiMessage & { attachments?: Attachment[] }) => ({
        id: m.id,
        sender: m.sender_id === user.id ? "me" : "them",
        sender_id: m.sender_id,       
        receiver_id: m.receiver_id,
        content: m.content,
        createdAt: m.created_at,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        purpose: "General",
        status: m.is_seen ? "Read" : "Delivered",
        attachments: m.attachments || [],
      }));

      setMessages(mapped);
      
      // Populate conversations from messages
      const convs = mapped.reduce((acc: typeof conversations, msg) => {
        const otherUserId =
          msg.sender === "me"
            ? msg.receiver_id
            : msg.sender_id;

        if (!acc.find(c => c.user_id === otherUserId)) {
          let convName = "Co-Parent";
          let convChildName = null;

          // Use invitesResolved info instead of awaiting here
          if (activePlan?.invites && activePlan.invites.length > 0) {
            const invite = (activePlan.invites as PlanInviteWithResolved[]).find(
              inv => inv.resolved_user_id?.toString() === otherUserId
            );


            if (invite) {
              const matchedUser = invite.resolved_user_id ? { full_name: invite.email } : null; 
              convName = matchedUser?.full_name || invite.email;
            }

            convChildName = null; 
          }

          acc.push({
            user_id: otherUserId,
            plan_id: activePlan.id,
            name: msg.sender === "me" ? "Co-Parent" : convName,
            role: "Co-Parent",
            topic: "Plan conversation",
            caseRef: activePlan.title,
            childName: convChildName,
            lastMessage: msg.content,
            time: msg.time,
            createdAt: msg.createdAt,
          });
        }

        return acc;
      }, []);

      setConversations(convs);
    } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [activePlan, fetchByPlan, user?.id]);

  const [plansOpen, setPlansOpen] = useState(false);

  const isUserParticipantOfPlan = (planId: string, userId: string) => {
    if (!activePlan) return false;

    const participantIds: string[] = [activePlan.created_by];

    if (activePlan.invites && activePlan.invites.length > 0) {
      (activePlan.invites as PlanInviteWithResolved[]).forEach(inv => {
        if (inv.resolved_user_id) {
          participantIds.push(inv.resolved_user_id.toString());
        }
      });
    }

    return participantIds.includes(userId);
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
                {/* Search Bar */}
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts"
                      className="pl-9 rounded-full bg-cub-mint-light border-0"
                    />
                  </div>
                </div>

                {/* Plan Selector */}
                <div className="relative p-2">
                  <Button
                    variant="outline"
                    className="w-full rounded-full flex items-center justify-between px-4 py-2"
                    onClick={() => setPlansOpen((prev) => !prev)}
                  >
                    <span>{activePlan?.title || "Select Plan"}</span>
                    <Check className="w-4 h-4 text-primary" />
                  </Button>

                  {plansOpen && Array.isArray(plans) && plans.length > 0 && (
                    <div className="absolute top-12 left-0 z-10 w-full bg-card border rounded-2xl shadow-lg overflow-hidden">
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={async () => {
                            setPlansOpen(false);

                            try {
                              const { plan: fullPlan } = await api.getPlanById(plan.id);
                              setActivePlan(fullPlan);

                              let name = "Co-Parent";
                              let childName = null;

                              if (fullPlan.invites && fullPlan.invites.length > 0) {
                                const inviteEmail = fullPlan.invites[0].email;

                                try {
                                  const allUsers = await api.getUsers(); // GET /api/users
                                  const matchedUser = allUsers.find(u => u.email === inviteEmail);
                                  name = matchedUser?.full_name || inviteEmail;
                                } catch (err) {
                                  console.error("Failed to resolve invite user full_name:", err);
                                  name = fullPlan.invites[0].email; // fallback
                                }

                                childName = null;
                              }

                              setSelectedConversation({
                                user_id: fullPlan.created_by,
                                plan_id: fullPlan.id,
                                name,
                                role: "Co-Parent",
                                topic: "Plan conversation",
                                caseRef: fullPlan.title,
                                childName,
                                lastMessage: "",
                                time: "",
                                createdAt: fullPlan.created_at,
                              });
                            } catch (err) {
                              console.error("Failed to fetch full plan:", err);
                              alert("Unable to fetch full plan details.");
                              setActivePlan(null);
                            }
                          }}
                          className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted ${
                            activePlan?.id === plan.id ? "bg-muted" : ""
                          }`}
                        >
                          <span className="text-sm">{plan.title}</span>
                          {activePlan?.id === plan.id && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contacts List */}
                <div className="space-y-1 p-2 mt-2">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-1">
                      No contacts yet.
                    </p>
                  ) : (
                    conversations.map((conv, idx) => {
                      const userIdStr = user?.id.toString();
                      const disabled = !isUserParticipantOfPlan(conv.plan_id, userIdStr);

                      return (
                        <button
                          key={`${conv.user_id ?? conv.plan_id}-${idx}`}
                          disabled={disabled}
                          onClick={() => {
                            if (!isUserParticipantOfPlan(conv.plan_id, user.id)) return;
                            setSelectedConversation(conv);
                          }}
                          className={`w-full p-4 rounded-2xl text-left transition-all ${
                            selectedConversation?.user_id === conv.user_id
                              ? "bg-cub-mint-light"
                              : "hover:bg-secondary"
                          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <p className="font-display font-bold">{conv.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage || "No messages yet"}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="md:col-span-8 flex flex-col min-h-[500px]">
                {/* Conversation Context Header */}
                <div className="border-b px-6 py-4 bg-muted/30">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {selectedConversation && (
                          <>
                            <h2 className="font-display font-bold text-lg">
                              {selectedConversation.name}
                            </h2>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {selectedConversation.role}
                            </span>
                          </>
                        )}
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
                        <strong>Case:</strong> {selectedConversation?.caseRef || "-"}
                      </span>

                      {selectedConversation?.childName && (
                        <span>
                          <strong>Child:</strong> {selectedConversation.childName}
                        </span>
                      )}

                      <span>
                        <strong>Started:</strong>{" "}
                        {selectedConversation ? new Date(selectedConversation.createdAt).toLocaleDateString() : "-"}
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
                            <p className="mt-1">{msg.content}</p>

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
                      value={draft.content}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, content: e.target.value }))
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
                          type: "Document" as AttachmentType, 
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
                        draft.content.trim() === "" ? "bg-muted cursor-not-allowed" : "bg-primary"
                      }`}
                      disabled={draft.content.trim() === ""}
                      onClick={async () => {
                        if (!user || !activePlan || !selectedConversation) return;

                        try {
                        const sentMessage = await send({
                          sender_id: userIdStr,               
                          receiver_id: selectedConversation.user_id,
                          plan_id: activePlan.id,
                          content: draft.content.trim(),
                        });

                        // Optimistic UI update — use UUID strings for IDs
                        // Generate a temporary unique ID for optimistic message to avoid duplicate keys
                        const tempId = `temp-${Date.now()}`;

                        setMessages(prev => [
                          ...prev,
                          {
                            id: tempId, // temporary ID
                            sender: "me",
                            sender_id: sentMessage.sender_id,
                            receiver_id: sentMessage.receiver_id,
                            content: sentMessage.content,
                            createdAt: sentMessage.created_at,
                            time: new Date(sentMessage.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                            purpose: draft.purpose,
                            status: sentMessage.is_seen ? "Read" : "Delivered",
                            attachments: sentMessage.attachments || [],
                          },
                        ]);

                        // Update sidebar preview
                        setConversations(prev =>
                          prev.map(c =>
                            c.user_id === userIdStr
                              ? {
                                  ...c,
                                  lastMessage: sentMessage.content,
                                  time: new Date(sentMessage.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }),
                                }
                              : c
                          )
                        );

                        setDraft({ content: "", purpose: "General", attachments: [] });
                      } catch (err: unknown) {
                        let description = "Unknown error";

                        if (err instanceof Error) {
                          description = err.message;
                        } else if (typeof err === "object" && err !== null && "message" in err) {
                          description = (err as { message: string }).message;
                        }
                        toast({
                          title: "Failed to send message",
                          description,
                          variant: "destructive",
                        });
                      }}
                    }
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Guidance and character count */}
                  <div className="flex justify-between text-xs text-muted-foreground px-2">
                    <span>Type a clear, professional message.</span>
                    <span>{draft.content.length} / 500</span>
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
