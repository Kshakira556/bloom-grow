import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Paperclip,
  Search,
  Check,
  CheckCheck,
  Clock,
} from "lucide-react";
import { useState } from "react";

const conversations = [
  {
    id: 1,
    name: "Alex Thompson",
    avatar: "AT",
    lastMessage: "Thanks for confirming the pickup time!",
    time: "2m ago",
    unread: 2,
  },
  {
    id: 2,
    name: "Mediator (Sarah)",
    avatar: "MS",
    lastMessage: "I've reviewed both schedules and...",
    time: "1h ago",
    unread: 0,
  },
];

const mockMessages = [
  {
    id: 1,
    sender: "them",
    text: "Hi! Can we discuss the holiday schedule?",
    time: "10:30 AM",
    status: "read",
  },
  {
    id: 2,
    sender: "me",
    text: "Sure! I was thinking Emma could be with me for Christmas Eve and with you for Christmas Day.",
    time: "10:32 AM",
    status: "read",
  },
  {
    id: 3,
    sender: "them",
    text: "That works for me. What about New Year's?",
    time: "10:35 AM",
    status: "read",
  },
  {
    id: 4,
    sender: "me",
    text: "I'm flexible on New Year's. Do you have any preferences?",
    time: "10:40 AM",
    status: "delivered",
  },
  {
    id: 5,
    sender: "them",
    text: "I'd love to have both kids for New Year's Eve if possible. We're planning a small family gathering.",
    time: "10:45 AM",
    status: "read",
  },
  {
    id: 6,
    sender: "me",
    text: "That sounds great! Let's make it official in the calendar.",
    time: "10:48 AM",
    status: "sent",
  },
];

const Messages = () => {
  const [message, setMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);

  const handleSend = () => {
    if (message.trim()) {
      // Handle send logic
      setMessage("");
    }
  };

  return (
    <DashboardLayout>
      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
        {/* Conversations List */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Messages
                </CardTitle>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search messages..." className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedConversation.id === conv.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-cub-sage-light flex items-center justify-center flex-shrink-0">
                        <span className="font-display font-bold text-cub-sage">
                          {conv.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold truncate">
                            {conv.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {conv.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.lastMessage}
                        </p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cub-coral-light flex items-center justify-center">
                  <span className="font-display font-bold text-cub-coral">
                    {selectedConversation.avatar}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold">{selectedConversation.name}</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 bg-success rounded-full" />
                    Online
                  </span>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-auto py-4">
              <div className="space-y-4">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        msg.sender === "me" ? "message-sent" : "message-received"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        msg.sender === "me" ? "justify-end opacity-70" : "text-muted-foreground"
                      }`}>
                        <span>{msg.time}</span>
                        {msg.sender === "me" && (
                          <>
                            {msg.status === "sent" && <Clock className="w-3 h-3" />}
                            {msg.status === "delivered" && <Check className="w-3 h-3" />}
                            {msg.status === "read" && <CheckCheck className="w-3 h-3" />}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon" disabled={!message.trim()}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Messages are logged and may be reviewed by your moderator
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
