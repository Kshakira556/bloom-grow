import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";
import * as api from "@/lib/api";
import { toast } from "@/lib/toastHelper";
import { useState, useEffect } from "react";

const ConversationSidebar = ({ plans, activePlan, setActivePlan, plansOpen, setPlansOpen, conversations, setConversations, selectedConversation, setSelectedConversation, user, isUserParticipantOfPlan }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Co-Parent");
  const [showAddContact, setShowAddContact] = useState(false);

  const handleAddContact = async () => {
    if (!name.trim() || !activePlan) {
      toast({ title: "Name required", description: "Please enter a name.", variant: "destructive" });
      return;
    }

    try {
      // Check if user exists
      const allUsers = await api.getUsers();
      const matchedUser = allUsers.find(
        (u) => u.email === email.trim() || u.phone === phone.trim()
      );

      let userId: string;
      let contactName: string = name.trim();

      if (matchedUser) {
        userId = matchedUser.id;
        contactName = matchedUser.full_name;
        toast({ title: "User found", description: `${contactName} added to conversations.` });
      } else {
        // Send invite if user doesn't exist
        const contactPayload: api.InviteUserPayload = {
          name: contactName,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          relationship: relationship || "Co-Parent",
        };

        await api.inviteUser(contactPayload);

        userId = `invite-${Date.now()}`; // temporary ID
        toast({ title: "Contact added", description: `${contactName} will receive an invitation.` });
      }

      const newConv = {
        id: undefined,
        user_id: userId,
        plan_id: activePlan.id,
        name: contactName,
        role: "Co-Parent",
        topic: "Plan conversation",
        caseRef: activePlan.title,
        childName: null,
        lastMessage: "",
        time: "",
        createdAt: new Date().toISOString(),
        updated_at: null,
      };

      setSelectedConversation(newConv);
      setConversations((prev) => [newConv, ...prev]);

      // reset inputs
      setName("");
      setEmail("");
      setPhone("");
      setRelationship("Co-Parent");

      // <-- NEW: Automatically close the Add Contact input
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
      if (!user || !activePlan) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch("/api/contacts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch contacts");

        const data = await res.json();

        if (Array.isArray(data.contacts)) {
          const convs = data.contacts.map(c => ({
            user_id: c.user_id,
            plan_id: activePlan.id,
            name: c.name,
            role: c.relationship || "Co-Parent",
            topic: "Plan conversation",
            caseRef: activePlan.title,
            childName: null,
            lastMessage: "",
            time: "",
            createdAt: c.created_at,
          }));

          setConversations(convs); 
        }
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      }
    };

    fetchContacts();
  }, [user?.id, activePlan?.id]); 

  return (
    <div className="md:col-span-4 border-r">
      {/* Add Contact Section */}
<div className="p-4">
  {!showAddContact ? (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setShowAddContact(true)}
    >
      + Add Contact
    </Button>
  ) : (
    <div className="p-2 space-y-2 bg-muted rounded-xl">
      <Input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        placeholder="Relationship (optional)"
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
      />

      <div className="flex gap-2">
        <Button
          onClick={handleAddContact}
          disabled={!name.trim()}
          className="flex-1"
        >
          Add
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => setShowAddContact(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  )}
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
                  setActivePlan(plan);
                  setPlansOpen(false); 
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
          conversations.map((conv, idx) => {
            const disabled = false;

            // Fix: always use the name from the conversation object, not fallback to "Co-Parent"
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
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;
