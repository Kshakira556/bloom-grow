import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";
import { useState } from "react";

const ConversationSidebar = ({ plans, activePlan, setActivePlan, plansOpen, setPlansOpen, conversations, selectedConversation, setSelectedConversation, user, isUserParticipantOfPlan }) => {
  return (
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
                onClick={async () => setActivePlan(plan)}
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
          <p className="text-xs text-muted-foreground px-2 py-1">No contacts yet.</p>
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
  );
};

export default ConversationSidebar;
