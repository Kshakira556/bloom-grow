import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Search, Send } from "lucide-react";
import { useState } from "react";

const conversations = [
  { id: 1, name: "Parent B", lastMessage: "The message preview", time: "13:56" },
  { id: 2, name: "Child Councilor", lastMessage: "The message preview", time: "" },
  { id: 3, name: "Lawyer", lastMessage: "The message preview", time: "" },
];

const mockMessages = [
  { id: 1, sender: "them", text: "The message", time: "13:56" },
  { id: 2, sender: "me", text: "The message", time: "13:59" },
  { id: 3, sender: "them", text: "The message", time: "14:04" },
  { id: 4, sender: "me", text: "The message", time: "14:16" },
];

const Messages = () => {
  const [message, setMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6">Messages</h1>

          <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-12">
              {/* Sidebar */}
              <div className="md:col-span-4 border-r">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search contacts" className="pl-9 rounded-full bg-cub-mint-light border-0" />
                  </div>
                </div>
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 rounded-2xl text-left transition-all ${
                        selectedConversation.id === conv.id ? "bg-cub-mint-light" : "hover:bg-secondary"
                      }`}
                    >
                      <p className="font-display font-bold">{conv.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="md:col-span-8 flex flex-col min-h-[500px]">
                <div className="flex-1 p-6 space-y-4">
                  {mockMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${msg.sender === "me" ? "message-sent" : "message-received"}`}>
                        <p>{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t flex items-center gap-3">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 rounded-full"
                  />
                  <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                    <Send className="w-5 h-5" />
                  </button>
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
