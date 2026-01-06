import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const moods = ["😊", "😢", "😴", "🤒", "😤", "🥰"];

const Journal = () => {
  const [selectedMood, setSelectedMood] = useState<string>(""); 
  const [entryText, setEntryText] = useState(""); 
  const [entryImage, setEntryImage] = useState<string | null>(null);
  const [entries, setEntries] = useState<
    { text: string; mood: string; image: string | null; type: "all" | "my" | "sent" }[]
  >([
    { text: "Morning walk with the dog", mood: "😊", image: null, type: "all" },
    { text: "Sent a postcard to Grandma", mood: "🥰", image: null, type: "all" },
    { text: "Read a book", mood: "😴", image: null, type: "my" },
    { text: "Shared notes with friend", mood: "😢", image: null, type: "sent" },
  ]);
  const maxChars = 2000;
  const [viewMode, setViewMode] = useState<"all" | "my" | "sent">("all");

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-2">My Little Journal</h1>
          <p className="text-center text-muted-foreground mb-8">One-page, private, and stored in your browser.</p>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Entry Form */}
            <Card className="rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-display font-bold text-xl">Journal</h2>
                
                <Input placeholder="Title (optional)" className="rounded-full bg-cub-mint-light border-0" />

                {/* Image Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-muted-foreground">Attach Image:</label>
                  <input
                    type="file"
                    aria-label="Attach Image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setEntryImage(reader.result as string); // save Base64 string
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="border rounded p-1"
                  />
                  {entryImage && (
                    <div className="relative mt-2 border rounded-2xl overflow-hidden">
                      <img
                        src={entryImage}
                        alt="Preview"
                        className="max-h-48 w-full object-cover"
                      />
                      <button
                        onClick={() => setEntryImage(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                        aria-label="Remove Image"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                
                <Textarea 
                  placeholder="Write your entry.. (autosaves as draft)" 
                  className="min-h-[150px] rounded-2xl bg-cub-mint-light border-0 resize-none"
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value.slice(0, maxChars))}
                />

                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Mood:</span>
                    <div className="flex gap-1">
                      {moods.map((mood) => (
                        <button
                          key={mood}
                          className={`text-lg p-1 rounded-full transition-transform ${
                            selectedMood === mood ? "bg-cub-blue text-white" : "hover:scale-125"
                          }`}
                          onClick={() => setSelectedMood(mood)}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                    {selectedMood && (
                      <span className="ml-2 text-sm font-bold">Current Mood: {selectedMood}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{entryText.length}/{maxChars}</span>
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      setEntries([...entries, { text: entryText, mood: selectedMood, image: entryImage, type: "sent" }]);
                      setEntryText("");
                      setSelectedMood("");
                      setEntryImage(null);
                    }}
                  >
                    Add Entry
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Entries List */}
            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <h2 className="font-display font-bold text-xl mb-4">Entries ({entries.length})</h2>

                {/* Buttons: My Entries / Sent Entries */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={viewMode === "all" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setViewMode("all")}
                  >
                    All Entries
                  </Button>
                  <Button
                    variant={viewMode === "my" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setViewMode("my")}
                  >
                    My Entries
                  </Button>
                  <Button
                    variant={viewMode === "sent" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setViewMode("sent")}
                  >
                    Sent Entries
                  </Button>
                </div>

                {entries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No entries found — add your first one above</p>
                    <p className="text-sm mt-2">[selected entries will be viewed in the same format]</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.filter(entry => viewMode === "all" || entry.type === viewMode).map((entry, idx) => (
                      <Card key={idx} className="rounded-3xl">
                        <CardContent className="p-4 space-y-2">
                          {entry.mood && <div className="text-lg">{entry.mood}</div>}
                          {entry.image && (
                            <img
                              src={entry.image}
                              alt="Entry"
                              className="max-h-48 rounded-2xl object-cover border"
                            />
                          )}
                          <p className="whitespace-pre-wrap">{entry.text}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="mt-6 p-4 bg-cub-mint-light rounded-2xl">
                  <p className="font-display font-bold text-sm mb-2">Quick tips</p>
                  <p className="text-sm text-muted-foreground">Your notes are stored in your browser only.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Journal;
