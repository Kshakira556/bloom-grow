// React &
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useMessagesWS } from "@/hooks/useMessagesWS";

//UI Components
import { Navbar } from "@/components/layout/Navbar";
import Banner from "@/components/ui/Banner";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";

//API & utilities
import * as api from "@/lib/api";
import { toast } from "@/lib/toastHelper";
import { isUserParticipantOfPlan } from "@/lib/messages";
import { exportConversation } from "@/lib/exportConversation";

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
  const [purposeFilter, setPurposeFilter] = useState<MessagePurpose | "All">("All");
  const [draft, setDraft] = useState<DraftMessage>({ content: "", purpose: "General", attachments: [] });
  const { user } = useAuth();
  const userId = user?.id?.toString() ?? "";
  const { fetchByPlan, send, markSeen, update, remove } = useMessages();

  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [invitesResolved, setInvitesResolved] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);

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
      console.error("Failed to delete message:", err);
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

    const fetchAllUsers = async () => {
      try {
        const allUsers = await api.getUsers();
        const updatedInvites = (activePlan.invites as PlanInviteWithResolved[]).map((inv) => {
          const matchedUser = allUsers.find((u) => u.email === inv.email);
          return matchedUser ? { ...inv, resolved_user_id: matchedUser.id } : inv;
        });

        setActivePlan({ ...activePlan, invites: updatedInvites });
        setInvitesResolved(true);
      } catch (err) {
        console.error("Failed to fetch users to resolve invites:", err);
      }
    };

    fetchAllUsers();
  }, [activePlan, invitesResolved]);

  useEffect(() => {
    if (!activePlan || !userId) return;

    const fetchMessages = async () => {
      try {
        const mappedMessages = await fetchByPlan(activePlan.id, userId);
        setMessages(mappedMessages);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [activePlan, fetchByPlan, userId]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6">Messages</h1>

          <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-12">
              <ConversationSidebar
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
              <div className="md:col-span-8 flex flex-col h-[600px]">
                {/* Chat Header */}
                <ChatHeader
                  selectedConversation={selectedConversation}
                  purposeFilter={purposeFilter}
                  setPurposeFilter={setPurposeFilter}
                  exportConversation={(format: "pdf" | "docx") => {
                    if (!selectedConversation) return;
                    exportConversation(
                      messages,
                      {
                        user_id: selectedConversation.user_id,
                        name: selectedConversation.name,
                        role: selectedConversation.role,
                        caseRef: selectedConversation.caseRef,
                        childName: selectedConversation.childName,
                      },
                      purposeFilter,
                      format
                    );
                  }}
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
                    messages={messages}
                    purposeFilter={purposeFilter}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
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

                    try {
                      await send({
                        sender_id: userId,
                        receiver_id: selectedConversation.user_id,
                        plan_id: activePlan.id,
                        content: draft.content.trim(),
                        purpose: draft.purpose,
                        attachments: draft.attachments || [],
                      });

                      setDraft({
                        content: "",
                        purpose: "General",
                        attachments: [],
                      });

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
                    }
                  }}
                  disabled={!selectedConversation?.user_id}
                  selectedConversation={selectedConversation}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
