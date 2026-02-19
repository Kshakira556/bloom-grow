// React &
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";

//UI Components
import { Navbar } from "@/components/layout/Navbar";
import Banner from "@/components/ui/Banner";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";

//API & utilities
import * as api from "@/lib/api";
import { ApiMessage } from "@/lib/api";
import { toast } from "@/lib/toastHelper";
import { isUserParticipantOfPlan } from "@/lib/messages";
import { exportConversation } from "@/lib/exportConversation";

// Types
import { Message, DraftMessage, MessagePurpose, Attachment } from "@/types/messages";

type PlanInviteWithResolved = api.PlanInvite & {
  resolved_user_id?: number;
};

const PURPOSES: Array<MessagePurpose | "All"> = ["All", "General", "Legal", "Medical", "Safety", "Emergency", "Financial"];

const Messages = () => {
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [purposeFilter, setPurposeFilter] = useState<MessagePurpose | "All">("All");
  const [draft, setDraft] = useState<DraftMessage>({ content: "", purpose: "General", attachments: [], });
  const { user } = useAuth();
  const userIdStr = user?.id.toString(); 
  const { fetchByPlan, send, markSeen } = useMessages();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { plans } = await api.getPlans(); 
        setPlans(plans);

        if (plans[0]) {
          const { plan: fullPlan } = await api.getPlanById(plans[0].id); 
          setActivePlan(fullPlan);

          const resolveInviteName = async (invites?: PlanInvite[]) => {
            if (!invites || invites.length === 0) return { name: "Co-Parent", childName: null };

            const inviteEmail = invites[0].email;
            try {
              const allUsers = await api.getUsers();
              const matchedUser = allUsers.find(u => u.email === inviteEmail);
              return { name: matchedUser?.full_name || inviteEmail, childName: null };
            } catch (err) {
              console.error("Failed to resolve invite user full_name:", err);
              return { name: inviteEmail, childName: null };
            }
          };
          const { name, childName } = await resolveInviteName(fullPlan.invites);

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
      
      const mapMessageToConversation = (
        msg: Message, 
        activePlan: api.FullPlan, 
        userId: string
      ) => {
        const otherUserId = msg.sender === "me" ? msg.receiver_id : msg.sender_id;

        if (!activePlan.invites) return null;

        const invite = (activePlan.invites as PlanInviteWithResolved[]).find(
          inv => inv.resolved_user_id?.toString() === otherUserId
        );

        const convName = invite ? invite.email : "Co-Parent";

        return {
          user_id: otherUserId,
          plan_id: activePlan.id,
          name: msg.sender === "me" ? "Co-Parent" : convName,
          role: "Co-Parent",
          topic: "Plan conversation",
          caseRef: activePlan.title,
          childName: null,
          lastMessage: msg.content,
          time: msg.time,
          createdAt: msg.createdAt,
        };
      };

      const convs = mapped.reduce((acc, msg) => {
        const conv = mapMessageToConversation(msg, activePlan, userIdStr);
        if (conv && !acc.find(c => c.user_id === conv.user_id)) acc.push(conv);
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
              <ConversationSidebar
                plans={plans}
                activePlan={activePlan}
                setActivePlan={setActivePlan}
                plansOpen={plansOpen}
                setPlansOpen={setPlansOpen}
                conversations={conversations}
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
                user={user}
                isUserParticipantOfPlan={isUserParticipantOfPlan}
              />
              
              {/* Chat Area */}
              <div className="md:col-span-8 flex flex-col min-h-[500px]">
                {/* Chat Header */}
                <ChatHeader
                  selectedConversation={selectedConversation}
                  purposeFilter={purposeFilter}
                  setPurposeFilter={setPurposeFilter}
                  exportConversation={(format: "pdf" | "docx") => {
                    if (!selectedConversation) return;
                    exportConversation(messages, {
                      user_id: selectedConversation.user_id,
                      name: selectedConversation.name,
                      role: selectedConversation.role,
                      caseRef: selectedConversation.caseRef,
                      childName: selectedConversation.childName,
                    }, purposeFilter, format);
                  }}
                />
                
                {/* Audit & Oversight Banner */}
                <Banner text="⚠️ This conversation is logged and auditable for mediation purposes." color="bg-red-100 border-red-500 text-red-700" />
                <Banner text="💬 Communication here is structured, auditable, and linked to parenting plans." color="bg-cub-mint-light border-primary text-primary" />


                <MessageList
                  messages={messages}
                  purposeFilter={purposeFilter}
                />

                <MessageInput
                  draft={draft}
                  setDraft={setDraft}
                  onSend={async () => {
                    if (!user || !activePlan || !selectedConversation) return;

                    try {
                      const sentMessage = await send({
                        sender_id: userIdStr,
                        receiver_id: selectedConversation.user_id,
                        plan_id: activePlan.id,
                        content: draft.content.trim(),
                      });

                      const tempId = `temp-${Date.now()}`;

                      setMessages((prev) => [
                        ...prev,
                        {
                          id: tempId,
                          sender: "me",
                          sender_id: sentMessage.sender_id,
                          receiver_id: sentMessage.receiver_id,
                          content: sentMessage.content,
                          createdAt: sentMessage.created_at,
                          time: new Date(
                            sentMessage.created_at
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                          purpose: draft.purpose,
                          status: sentMessage.is_seen
                            ? "Read"
                            : "Delivered",
                          attachments:
                            sentMessage.attachments || [],
                        },
                      ]);

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
