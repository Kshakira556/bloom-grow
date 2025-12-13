import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Plus,
  Search,
  Image,
  Heart,
  MessageCircle,
  Calendar,
  User,
  Star,
} from "lucide-react";
import { useState } from "react";

const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🤒", label: "Sick" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🥰", label: "Loved" },
];

const journalEntries = [
  {
    id: 1,
    child: "Emma",
    date: "Today, 2:30 PM",
    mood: "😊",
    title: "Great day at school!",
    content: "Emma came home excited about her science project. She's building a volcano with her friends and can't stop talking about it!",
    images: 2,
    likes: 1,
    author: "Mom",
    milestone: false,
  },
  {
    id: 2,
    child: "Liam",
    date: "Yesterday",
    mood: "🥰",
    title: "First word: 'Dada'",
    content: "Liam said his first clear word today! He pointed at his dad on the video call and said 'Dada'. We're all so proud!",
    images: 1,
    likes: 2,
    author: "Dad",
    milestone: true,
  },
  {
    id: 3,
    child: "Emma",
    date: "Jan 12, 2024",
    mood: "😴",
    title: "Sleepy after swimming",
    content: "Emma had her first swimming lesson today. She was nervous at first but ended up loving it. Fell asleep on the car ride home!",
    images: 3,
    likes: 2,
    author: "Mom",
    milestone: false,
  },
  {
    id: 4,
    child: "Liam",
    date: "Jan 10, 2024",
    mood: "🤒",
    title: "Feeling under the weather",
    content: "Liam has a slight cold. Gave him his medicine at 8am and 2pm. Temperature was 99.5°F. Resting well now.",
    images: 0,
    likes: 0,
    author: "Dad",
    milestone: false,
  },
];

const children = [
  { id: 1, name: "Emma", age: "6 years", avatar: "E" },
  { id: 2, name: "Liam", age: "18 months", avatar: "L" },
];

const Journal = () => {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const filteredEntries = journalEntries.filter((entry) => {
    if (selectedChild && entry.child !== selectedChild) return false;
    if (selectedMood && entry.mood !== selectedMood) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search journal..." className="pl-9 w-64" />
              </div>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Entry
            </Button>
          </div>

          {/* Mood Filter */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Filter by mood:</span>
                <div className="flex gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.label}
                      onClick={() => setSelectedMood(selectedMood === mood.emoji ? null : mood.emoji)}
                      className={`mood-badge ${selectedMood === mood.emoji ? "selected" : ""} bg-secondary hover:bg-secondary/80`}
                      title={mood.label}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Journal Entries */}
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      entry.child === "Emma" ? "bg-cub-coral-light" : "bg-cub-sky-light"
                    }`}>
                      {entry.mood}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-lg">{entry.title}</h3>
                            {entry.milestone && (
                              <span className="flex items-center gap-1 text-xs bg-cub-honey-light text-cub-honey px-2 py-1 rounded-full">
                                <Star className="w-3 h-3" />
                                Milestone
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {entry.child}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {entry.date}
                            </span>
                            <span>by {entry.author}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-3">{entry.content}</p>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                        {entry.images > 0 && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Image className="w-4 h-4" />
                            {entry.images} photo{entry.images > 1 ? "s" : ""}
                          </span>
                        )}
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                          <Heart className="w-4 h-4" />
                          {entry.likes}
                        </button>
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Children Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Children
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedChild(null)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    !selectedChild ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary"
                  }`}
                >
                  <span className="font-medium">All Children</span>
                </button>
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child.name)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      selectedChild === child.name 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-secondary"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      child.name === "Emma" ? "bg-cub-coral-light" : "bg-cub-sky-light"
                    }`}>
                      <span className={`font-display font-bold ${
                        child.name === "Emma" ? "text-cub-coral" : "text-cub-sky"
                      }`}>
                        {child.avatar}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <p className="text-sm text-muted-foreground">{child.age}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-cub-honey" />
                Recent Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-cub-honey-light rounded-xl">
                  <p className="font-display font-bold text-sm">First word!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Liam • Yesterday
                  </p>
                </div>
                <div className="p-3 bg-cub-sage-light rounded-xl">
                  <p className="font-display font-bold text-sm">Lost first tooth</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Emma • Jan 5, 2024
                  </p>
                </div>
                <div className="p-3 bg-cub-lavender-light rounded-xl">
                  <p className="font-display font-bold text-sm">Started preschool</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Emma • Sep 1, 2023
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Journal;
