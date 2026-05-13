// React &
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useMessagesWS } from "@/hooks/useMessagesWS";
import { SlidersHorizontal } from "lucide-react";

//UI Components
import { Navbar } from "@/components/layout/Navbar";
import Banner from "@/components/ui/Banner";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

//API & utilities
import * as api from "@/lib/api";
import { toast } from "@/lib/toastHelper";
import { isUserParticipantOfPlan, mapApiMessageToMessage } from "@/lib/messages";
import { exportConversation } from "@/lib/exportConversation";
import { PURPOSES } from "@/constants/purposes";

// Types
import { Message, DraftMessage, MessagePurpose } from "@/types/messages";

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

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState<MessagePurpose | "All">("All");
  const [draft, setDraft] = useState<DraftMessage>({ content: "", purpose: "General", attachments: [] });
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const userId = user?.id?.toString() ?? "";
  const { fetchByPlan, send, markSeen, update, remove } = useMessages();

  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [invitesResolved, setInvitesResolved] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasAutoSelectedRef = useRef(false);
  const paginationLimitRef = useRef(50);

  useEffect(() => {
    setInvitesResolved(false);
  }, [activePlan?.id]);

  useMessagesWS({
    user,
    activePlan,
    userId,
    markSeen,
    setMessages,
    selectedConversation,
  });

  const handleEditMessage = async (id: string, newContent: string) => {
    try {
      await update(id, newContent);

      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: newContent } : m)));
    } catch (err) {
      console.error("Failed to update message:", err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await remove(id);

      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const alreadyGone =
        message.toLowerCase().includes("not found") ||
        message.toLowerCase().includes("already deleted");

      if (alreadyGone) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        return;
      }

      toast({
        title: "Delete failed",
        description: message || "Could not delete message.",
        variant: "destructive",
      });
    }
  };

  const handleFlagMessage = async (id: string, reason?: string) => {
    try {
      await api.flagMessage(id, reason);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, is_flagged: true, flagged_reason: reason } : m
        )
      );
      toast({
        title: "Message flagged",
        description: "Thanks — this message has been marked for review.",
      });
    } catch (err) {
      console.error("Failed to flag message:", err);
      toast({
        title: "Flag failed",
        description: err instanceof Error ? err.message : "Failed to flag message",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { plans } = await api.getPlans();
        setPlans(plans);

        if (plans[0]) {
          const { plan: fullPlan } = await api.getPlanById(plans[0].id);
          setActivePlan(fullPlan);
        }
      } catch (err) {
        console.error("Failed to load plans:", err);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (!activePlan || !activePlan.invites || invitesResolved) return;

    const resolveInvites = async () => {
      try {
        const updatedInvites = await Promise.all(
          (activePlan.invites as PlanInviteWithResolved[]).map(async (inv) => {
            try {
              const matchedUser = await api.getUserByEmail(inv.email);
              return { ...inv, resolved_user_id: matchedUser.id };
            } catch {
              return inv;
            }
          }),
        );

        setActivePlan((prev) =>
          prev && prev.id === activePlan.id ? { ...prev, invites: updatedInvites } : prev,
        );
        setInvitesResolved(true);
      } catch (err) {
        console.error("Failed to fetch users to resolve invites:", err);
      }
    };

    resolveInvites();
  }, [activePlan, invitesResolved]);

useEffect(() => {
  const activePlanId = activePlan?.id;
  if (!activePlanId || !userId) return;

  const fetchMessages = async () => {
    try {
      const mappedMessages = await fetchByPlan(activePlanId, userId, {
        limit: paginationLimitRef.current,
      });
      setMessages((prev) => {
        if (!prev.length) return mappedMessages;

        const byId = new Map(prev.map((m) => [m.id, m]));
        for (const msg of mappedMessages) byId.set(msg.id, msg);
        return Array.from(byId.values());
      });
      setHasMoreMessages(mappedMessages.length >= paginationLimitRef.current);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  fetchMessages();

  const interval = window.setInterval(fetchMessages, 12000);
  return () => window.clearInterval(interval);
}, [activePlan?.id, userId, fetchByPlan]);

useEffect(() => {
  setHasMoreMessages(true);
  setLoadingOlderMessages(false);
}, [activePlan?.id]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const seenRequestsRef = useRef<Set<string>>(new Set());

  // Auto-select only once after contacts are first loaded.
  // This keeps initial mobile UX smooth, but still allows "Back" to stay on contacts.
  useEffect(() => {
    if (!conversations.length) return;

    if (!selectedConversation && !hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = true;
      setSelectedConversation(conversations[0]);
      return;
    }

    if (!selectedConversation) return;

    const stillExists = conversations.some(
      (conv) =>
        conv.user_id === selectedConversation.user_id &&
        conv.plan_id === selectedConversation.plan_id,
    );

    if (!stillExists) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  const visibleMessages = useMemo(() => {
    if (!selectedConversation?.user_id || !userId) {
      return [];
    }

    return messages.filter(
      (m) =>
        (String(m.sender_id) === String(userId) &&
          String(m.receiver_id) === String(selectedConversation.user_id)) ||
        (String(m.receiver_id) === String(userId) &&
          String(m.sender_id) === String(selectedConversation.user_id))
    );
  }, [messages, selectedConversation?.user_id, userId]);

  const oldestVisibleMessage = useMemo(() => {
    if (!visibleMessages.length) return null;
    return [...visibleMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
  }, [visibleMessages]);

  useEffect(() => {
    const activePlanId = activePlan?.id;
    if (!activePlanId || !selectedConversation?.user_id || !hasMoreMessages) return;
    if (loadingOlderMessages) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = async () => {
      if (container.scrollTop > 20) return;
      if (loadingOlderMessages || !hasMoreMessages) return;
      if (!oldestVisibleMessage?.createdAt) return;

      setLoadingOlderMessages(true);
      const previousHeight = container.scrollHeight;

      try {
        const older = await fetchByPlan(activePlanId, userId, {
          limit: paginationLimitRef.current,
          before: oldestVisibleMessage.createdAt,
        });

        if (!older.length) {
          setHasMoreMessages(false);
          return;
        }

        setMessages((prev) => {
          const byId = new Map(prev.map((m) => [m.id, m]));
          for (const msg of older) {
            if (!byId.has(msg.id)) byId.set(msg.id, msg);
          }
          return Array.from(byId.values());
        });

        if (older.length < paginationLimitRef.current) {
          setHasMoreMessages(false);
        }

        requestAnimationFrame(() => {
          const newHeight = container.scrollHeight;
          container.scrollTop = Math.max(0, newHeight - previousHeight);
        });
      } catch (err) {
        console.error("Failed to load older messages:", err);
      } finally {
        setLoadingOlderMessages(false);
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [
    activePlan?.id,
    userId,
    selectedConversation?.user_id,
    hasMoreMessages,
    loadingOlderMessages,
    oldestVisibleMessage?.createdAt,
    fetchByPlan,
  ]);

  // When a conversation is open, mark any incoming unseen messages as seen.
  useEffect(() => {
    if (!selectedConversation?.user_id || !userId) return;

    const unseenIncoming = visibleMessages.filter(
      (m) =>
        String(m.receiver_id) === String(userId) &&
        !m.is_seen &&
        !seenRequestsRef.current.has(m.id)
    );

    if (!unseenIncoming.length) return;

    for (const msg of unseenIncoming) {
      seenRequestsRef.current.add(msg.id);

      (async () => {
        try {
          await markSeen(msg.id);

          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? {
                    ...m,
                    status: "Read",
                    is_seen: true,
                  }
                : m
            )
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message.toLowerCase() : "";
          const isTransientFailure =
            message.includes("failed to fetch") ||
            message.includes("networkerror") ||
            message.includes("network request failed") ||
            message.includes("timeout") ||
            message.includes("temporar");

          if (isTransientFailure) {
            // allow retry only for likely transient/network failures
            seenRequestsRef.current.delete(msg.id);
          }
        }
      })();
    }
  }, [selectedConversation?.user_id, userId, visibleMessages, markSeen]);

  const handleExportConversation = async () => {
    if (!selectedConversation || !activePlan) return;

    try {
      const apiMessages = await api.getMessagesByPlan(activePlan.id, {
        includeDeleted: true,
      });
      const allMessages = apiMessages.map((msg) => mapApiMessageToMessage(msg, userId));

      const conversationMessages = allMessages.filter(
        (m) =>
          (m.sender_id === userId && m.receiver_id === selectedConversation.user_id) ||
          (m.receiver_id === userId && m.sender_id === selectedConversation.user_id),
      );

      const exportMessages =
        purposeFilter === "All"
          ? conversationMessages
          : conversationMessages.filter((m) => m.purpose === purposeFilter);

      const historyEntries = await Promise.all(
        exportMessages.map(async (msg) => [msg.id, await api.getMessageHistory(msg.id)] as const),
      );

      const historyById = Object.fromEntries(historyEntries);

      try {
        await api.createAuditEvent({
          action: "messages_export_pdf",
          target_type: "plan",
          target_id: activePlan.id,
          notes: {
            purpose_filter: purposeFilter,
            conversation_with_user_id: selectedConversation.user_id,
          },
        });
      } catch (err) {
        console.warn("Audit log failed (messages export):", err);
      }

      await exportConversation(
        conversationMessages,
        {
          user_id: selectedConversation.user_id,
          name: selectedConversation.name,
          role: selectedConversation.role,
          caseRef: selectedConversation.caseRef,
          childName: selectedConversation.childName,
        },
        purposeFilter,
        historyById,
      );
    } catch (err: unknown) {
      let description = "Failed to export conversation";
      if (err instanceof Error) description = err.message;
      toast({
        title: "Export failed",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-0 px-0 sm:py-8 sm:px-4">
        <div className="w-full sm:container sm:max-w-5xl sm:mx-auto">
          <h1 className="hidden sm:block font-display text-3xl font-bold text-primary text-center mb-6">
            Messages
          </h1>

          <div className="bg-card rounded-none sm:rounded-3xl shadow-sm overflow-hidden border-0 sm:border">
            <div className="grid md:grid-cols-12">
              <ConversationSidebar
                className={selectedConversation ? "hidden md:block" : ""}
                plans={plans}
                activePlan={activePlan}
                setActivePlan={setActivePlan}
                plansOpen={plansOpen}
                setPlansOpen={setPlansOpen}
                conversations={conversations}
                setConversations={setConversations}
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
                user={user}
                isUserParticipantOfPlan={isUserParticipantOfPlan}
                messages={messages}
              />

              {/* Chat Area */}
              <div
                className={[
                  "md:col-span-8 flex flex-col",
                  selectedConversation ? "flex" : "hidden md:flex",
                  "h-[calc(100dvh-64px)] md:h-[600px]",
                ].join(" ")}
              >
                {/* Chat Header */}
                <ChatHeader
                  selectedConversation={selectedConversation}
                  purposeFilter={purposeFilter}
                  setPurposeFilter={setPurposeFilter}
                  onBack={() => setSelectedConversation(null)}
                  exportConversation={handleExportConversation}
                  mobileMenuButton={
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(true)}
                      className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition inline-flex items-center gap-1"
                      title="Open chat menu"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Menu
                    </button>
                  }
                />

                {/* Audit & Oversight Banner */}
                <Banner
                  text="⚠️ This conversation is logged and auditable for mediation purposes."
                  color="bg-red-100 border-red-500 text-red-700"
                />
                <Banner
                  text="💬 Communication here is structured, auditable, and linked to parenting plans."
                  color="bg-cub-mint-light border-primary text-primary"
                />

                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto"
                >
                  <MessageList
                    messages={visibleMessages}
                    purposeFilter={purposeFilter}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onFlag={handleFlagMessage}
                    scrollContainerRef={scrollContainerRef} 
                  />
                </div>

                <MessageInput
                  draft={draft}
                  setDraft={setDraft}
                  onSend={async () => {
                    if (!user || !activePlan || !selectedConversation?.user_id) {
                      toast({
                        title: "No contact selected",
                        description: "Please select a contact to send a message.",
                        variant: "destructive",
                      });
                      return;
                    }

                    const trimmedContent = draft.content.trim();
                    const draftAttachments = draft.attachments || [];

                    if (sending) return;
                    setSending(true);

                    const uploadedAttachments: Array<{
                      name: string;
                      type: api.AttachmentType;
                      url: string;
                      content_type?: string;
                      size_bytes?: number;
                    }> = [];

                    try {
                      for (const attachment of draftAttachments) {
                        const file = (attachment as { file?: File })?.file;
                        if (!file) continue;

                        const ticket = await api.createMessageAttachmentSignedUpload({
                          plan_id: activePlan.id,
                          receiver_id: selectedConversation.user_id,
                          filename: attachment.name || "attachment",
                          content_type: attachment.content_type || file.type || "application/octet-stream",
                        });

                        const uploadRes = await fetch(ticket.signed_url, {
                          method: "PUT",
                          headers: {
                            "Content-Type": attachment.content_type || file.type || "application/octet-stream",
                          },
                          body: file,
                        });

                        if (!uploadRes.ok) {
                          const text = await uploadRes.text().catch(() => "");
                          throw new Error(`Upload failed (${uploadRes.status}): ${text || "Unable to upload file"}`);
                        }

                        if (attachment.url?.startsWith("blob:")) {
                          try {
                            URL.revokeObjectURL(attachment.url);
                          } catch {
                            // ignore
                          }
                        }

                        uploadedAttachments.push({
                          name: attachment.name,
                          type: attachment.type as api.AttachmentType,
                          url: ticket.path,
                          content_type: attachment.content_type,
                          size_bytes: attachment.size_bytes,
                        });
                      }
                    } catch (err) {
                      const message = err instanceof Error ? err.message : "Failed to upload attachment(s)";
                      toast({
                        title: "Attachment upload failed",
                        description: message,
                        variant: "destructive",
                      });
                      setSending(false);
                      return;
                    }

                    const fallbackAttachmentContent =
                      draftAttachments.length > 0 ? "Attachment" : "";
                    const contentToSend = trimmedContent || fallbackAttachmentContent;

                    if (!contentToSend) {
                      toast({
                        title: "Nothing to send",
                        description: "Type a message or attach a file first.",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      const sentMessage = await send({
                        sender_id: userId,
                        receiver_id: selectedConversation.user_id,
                        plan_id: activePlan.id,
                        content: contentToSend,
                        purpose: draft.purpose,
                        attachments: uploadedAttachments,
                      });

                      setMessages((prev) =>
                        prev.some((m) => m.id === sentMessage.id)
                          ? prev
                          : [...prev, sentMessage]
                      );

                      setDraft({
                        content: "",
                        purpose: "General",
                        attachments: [],
                      });
                      setSending(false);

                    } catch (err: unknown) {
                      let description = "Unknown error";

                      if (err instanceof Error) {
                        description = err.message;
                      }

                      toast({
                        title: "Failed to send message",
                        description,
                        variant: "destructive",
                      });
                      setSending(false);
                    }
                  }}
                  disabled={!selectedConversation?.user_id || sending}
                  selectedConversation={selectedConversation}
                />
              </div>
            </div>
          </div>
        </div>

        <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DrawerContent className="md:hidden max-h-[85vh] rounded-t-2xl">
            <DrawerHeader className="pb-2">
              <DrawerTitle>Message Menu</DrawerTitle>
            </DrawerHeader>

            <div className="px-4 pb-6 overflow-y-auto space-y-5">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-primary">Contacts</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConversation(null);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-xs px-3 py-2 rounded-full border bg-background hover:bg-muted transition"
                >
                  Open Contacts Panel
                </button>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No contacts yet.</p>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={`${conv.user_id}-${conv.createdAt}`}
                        type="button"
                        onClick={() => {
                          setSelectedConversation(conv);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border ${
                          selectedConversation?.createdAt === conv.createdAt
                            ? "bg-cub-mint-light border-primary"
                            : "bg-background border-border"
                        }`}
                      >
                        <p className="text-sm font-semibold">{conv.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{conv.role || "Co-Parent"}</p>
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-primary">Filter</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPurposeFilter("All")}
                    className={`text-xs px-3 py-1 rounded-full border transition ${
                      purposeFilter === "All"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    All
                  </button>
                  {PURPOSES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPurposeFilter(p)}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        purposeFilter === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-primary">Actions</h3>
                <button
                  type="button"
                  disabled={!selectedConversation}
                  onClick={async () => {
                    await handleExportConversation();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-xs px-3 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Export PDF
                </button>
              </section>

              <section className="space-y-1 text-xs text-muted-foreground">
                <h3 className="text-sm font-semibold text-primary">Conversation</h3>
                <p>
                  <strong>Case:</strong> {selectedConversation?.caseRef || "-"}
                </p>
                <p>
                  <strong>Started:</strong>{" "}
                  {selectedConversation
                    ? new Date(selectedConversation.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </section>
            </div>
          </DrawerContent>
        </Drawer>
      </main>
    </div>
  );
};

export default Messages;
