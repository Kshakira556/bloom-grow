import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import * as api from "@/lib/api";
import { toast } from "@/lib/toastHelper";
import { useState, useEffect } from "react";
import { Message } from "@/types/messages";
import { useAuth } from "@/hooks/useAuth";

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

type Props = {
  plans: api.Plan[];
  activePlan: api.FullPlan | null;
  setActivePlan: React.Dispatch<React.SetStateAction<api.FullPlan | null>>;
  plansOpen: boolean;
  setPlansOpen: React.Dispatch<React.SetStateAction<boolean>>;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  selectedConversation: Conversation | null;
  setSelectedConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  user: { id: string } | null;
  isUserParticipantOfPlan: (plan: api.FullPlan | null, userId: string) => boolean;
  messages: Message[];
};

const mapContactsToConversations = (
  contacts: api.ApiContact[],
  messages: Message[],
  plan: api.FullPlan,
  userId: string
): Conversation[] => {
  return contacts.map((c) => {
    const contactUserId = c.linked_user_id ?? "";
    const msgsForUser = messages
      .filter(
        (m) =>
          (m.sender_id === userId && m.receiver_id === contactUserId) ||
          (m.receiver_id === userId && m.sender_id === contactUserId)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      user_id: contactUserId,
      plan_id: plan.id,
      name: c.name,
      role: c.relationship || "Co-Parent",
      topic: "Plan conversation",
      caseRef: plan.title,
      childName: null,
      lastMessage: msgsForUser[0]?.content || "",
      time: msgsForUser[0]?.time || "",
      createdAt: c.created_at,
    };
  });
};

const ConversationSidebar = ({
  plans,
  activePlan,
  setActivePlan,
  plansOpen,
  setPlansOpen,
  conversations,
  setConversations,
  selectedConversation,
  setSelectedConversation,
  user,
  isUserParticipantOfPlan,
  messages,
}: Props) => {
  const { user: authUser } = useAuth();
  const userId = authUser?.id || "";
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Co-Parent");
  const [showAddContact, setShowAddContact] = useState(false);
  const [contacts, setContacts] = useState<api.ApiContact[]>([]);
  const [pendingContactInvites, setPendingContactInvites] = useState<api.ContactInvite[]>([]);

  const handleAddContact = async () => {
    if (!name || !name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name.",
        variant: "destructive",
      });
      return;
      console.log("DEBUG CONTACT INPUT:", {
        name,
        email,
        phone,
        relationship,
      });
    }

    try {
      const normalizedInputEmail = email.trim().toLowerCase();
      const duplicateByEmail =
        normalizedInputEmail.length > 0 &&
        contacts.some((contact) => (contact.email ?? "").trim().toLowerCase() === normalizedInputEmail);

      if (duplicateByEmail) {
        toast({
          title: "Contact already exists",
          description: "This email is already in your contacts.",
          variant: "destructive",
        });
        return;
      }

      let contactName: string = name.trim();

      const contactPayload: api.InviteUserPayload = {
        name: contactName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        relationship: relationship || "Co-Parent",
      };

      const result = await api.inviteUser({
        ...contactPayload,
        linked_user_id: null,
      });

      if (result?.invite) {
        toast({
          title: "Request sent",
          description: "They will need to accept or reject your contact request.",
        });

        const invites = await api.getContactInvites();
        setPendingContactInvites(invites);
      } else {
        toast({ title: "Contact added", description: `${contactName} will receive an invitation.` });

        const refreshedContacts = await api.getContacts();
        setContacts(refreshedContacts);

        const convs = activePlan
          ? mapContactsToConversations(refreshedContacts, messages, activePlan, userId)
          : [];
        setConversations(convs);

        const newConv = convs.find((c) => c.name === contactName) || convs[0];
        setSelectedConversation(newConv || null);
      }

      setName("");
      setEmail("");
      setPhone("");
      setRelationship("Co-Parent");
      setShowAddContact(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({ title: "Failed to add contact", description: err.message, variant: "destructive" });
      } else {
        toast({ title: "Failed to add contact", description: "Unknown error", variant: "destructive" });
      }
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      if (!activePlan) return;

      try {
        const contacts = await api.getContacts();
        setContacts(contacts);
        const invites = await api.getContactInvites();
        setPendingContactInvites(invites);
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      }
    };

    fetchContacts();
  }, [activePlan?.id]);

  useEffect(() => {
    if (!activePlan) {
      setConversations([]);
      return;
    }

    const convs = mapContactsToConversations(contacts, messages, activePlan, userId);
    setConversations(convs);
  }, [activePlan?.id, contacts, messages, setConversations]);

  return (
    <div className="md:col-span-4 border-r">
      {/* Add Contact Section */}
      <div className="p-4">
        {!showAddContact ? (
          <Button variant="outline" className="w-full" onClick={() => setShowAddContact(true)}>
            + Add Contact
          </Button>
        ) : (
          <div className="p-2 space-y-2 bg-muted rounded-xl">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input
              placeholder="Relationship (optional)"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={handleAddContact} disabled={!name.trim()} className="flex-1">
                Add
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setShowAddContact(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pending contact requests */}
      {pendingContactInvites.length > 0 && (
        <div className="px-4 pb-4">
          <div className="p-4 border rounded-2xl bg-blue-50">
            <p className="font-semibold text-sm mb-2">Contact requests awaiting your decision</p>
            <div className="space-y-2">
              {pendingContactInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-2 border rounded-xl p-3 bg-white"
                >
                  <div className="text-sm">
                    <p className="font-medium">{invite.name}</p>
                    <p className="text-xs text-muted-foreground">{invite.email}</p>
                    {invite.relationship && (
                      <p className="text-xs text-muted-foreground">Relationship: {invite.relationship}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await api.respondToContactInvite(invite.id, "accepted");
                          setPendingContactInvites((prev) => prev.filter((i) => i.id !== invite.id));
                          const refreshedContacts = await api.getContacts();
                          setContacts(refreshedContacts);
                          toast({ title: "Request accepted" });
                        } catch (err) {
                          toast({
                            title: "Failed to accept",
                            description: err instanceof Error ? err.message : "Failed to accept request",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await api.respondToContactInvite(invite.id, "rejected");
                          setPendingContactInvites((prev) => prev.filter((i) => i.id !== invite.id));
                          toast({ title: "Request rejected" });
                        } catch (err) {
                          toast({
                            title: "Failed to reject",
                            description: err instanceof Error ? err.message : "Failed to reject request",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  try {
                    const { plan: fullPlan } = await api.getPlanById(plan.id);
                    setActivePlan(fullPlan);
                    setPlansOpen(false);
                  } catch (err) {
                    console.error("Failed to load plan:", err);
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
      <div className="space-y-1 p-2 mt-2 overflow-y-auto max-h-[400px]">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-1">No contacts yet.</p>
        ) : (
          conversations.map((conv) => {
            const disabled = !conv.user_id;

            const displayName = conv.name || "Unnamed";

            return (
              <button
                key={`${conv.user_id}-${conv.createdAt}`}
                disabled={disabled}
                onClick={() => {
                  setSelectedConversation(conv);
                }}
                className={`w-full p-4 rounded-2xl text-left transition-all
                bg-white border
                ${
                  selectedConversation?.createdAt === conv.createdAt
                    ? "border-primary bg-cub-mint-light shadow-sm"
                    : "border-primary hover:bg-muted"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <p className="font-display font-bold">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {conv.lastMessage || "No messages yet"}
                </p>
                {disabled && (
                  <p className="text-xs text-muted-foreground mt-1">Invite pending</p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;


