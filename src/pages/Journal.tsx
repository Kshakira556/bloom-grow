import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const moods = ["😊", "😢", "😴", "🤒", "😤", "🥰"];

const Journal = () => {
  const [selectedMood, setSelectedMood] = useState<string>(""); 
  const [entryTitle, setEntryTitle] = useState("");
  const [entryText, setEntryText] = useState(""); 
  const [entryImage, setEntryImage] = useState<string | null>(null);

  const [entries, setEntries] = useState<
    { title?: string; text: string; mood: string; image: string | null; type: "all" | "received" | "sent" }[]
  >([
    { title: "Morning", text: "Morning walk with the dog", mood: "😊", image: null, type: "all" },
    { title: "Postcard", text: "Sent a postcard to Grandma", mood: "🥰", image: null, type: "all" },
    { title: "Book Reading", text: "Read a book", mood: "😴", image: null, type: "received" },
    { title: "Notes with friends", text: "Shared notes with friend", mood: "😢", image: null, type: "sent" },
  ]);

  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);

  const maxChars = 2000;
  const [viewMode, setViewMode] = useState<"all" | "received" | "sent">("all");

  const filteredEntries = entries.filter(
    (entry) => viewMode === "all" || entry.type === viewMode
  );

  const selectedEntry =
    selectedEntryIndex !== null ? filteredEntries[selectedEntryIndex] : null;

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-2">
            My Little Journal
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            One-page, private, and stored in your browser.
          </p>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Entry Form */}
            <Card className="rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-display font-bold text-xl">Journal</h2>
                
                <Input
                  placeholder="Title (optional)"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="rounded-full bg-cub-mint-light border-0"
                />

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
                          setEntryImage(reader.result as string); 
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
                      <span className="ml-2 text-sm font-bold">
                        Current Mood: {selectedMood}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {entryText.length}/{maxChars}
                  </span>
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      setEntries([
                        ...entries,
                        {
                          title: entryTitle || undefined,
                          text: entryText,
                          mood: selectedMood,
                          image: entryImage,
                          type: "sent",
                        },
                      ]);
                      setEntryTitle("");
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
                <h2 className="font-display font-bold text-xl mb-4">
                  {viewMode === "all" && `All Entries (${filteredEntries.length})`}
                  {viewMode === "received" && `Received Entries (${filteredEntries.length})`}
                  {viewMode === "sent" && `Sent Entries (${filteredEntries.length})`}
                </h2>

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
                    variant={viewMode === "received" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setViewMode("received")}
                  >
                    Received Entries
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

                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No entries found — add your first one above</p>
                    <p className="text-sm mt-2">
                      [selected entries will be viewed in the same format]
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEntries.map((entry, idx) => (
                      <Card
                        key={idx}
                        className="rounded-3xl cursor-pointer"
                        onClick={() => setSelectedEntryIndex(idx)}
                      >
                        <CardContent className="p-4 space-y-2">
                          {entry.mood && <div className="text-lg">{entry.mood}</div>}

                          {entry.title && (
                            <h3 className="font-display font-bold text-base">
                              {entry.title}
                            </h3>
                          )}

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
                  <p className="text-sm text-muted-foreground">
                    Your notes are stored in your browser only.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-3xl max-w-md w-full mx-4 relative">
            {/* Left Arrow */}
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl disabled:opacity-30"
              disabled={selectedEntryIndex === 0}
              onClick={() =>
                setSelectedEntryIndex((i) => (i !== null ? i - 1 : i))
              }
            >
              ←
            </button>

            {/* Close */}
            <button
              onClick={() => setSelectedEntryIndex(null)}
              className="absolute top-3 right-3"
            >
              ✕
            </button>

            <div className="p-6 space-y-4">
              {selectedEntry.mood && (
                <div className="text-2xl">{selectedEntry.mood}</div>
              )}

              {selectedEntry.title && (
                <h3 className="font-display font-bold text-xl">
                  {selectedEntry.title}
                </h3>
              )}

              {selectedEntry.image && (
                <img
                  alt="Child Journal Image"
                  src={selectedEntry.image}
                  className="rounded-2xl max-h-64 w-full object-cover"
                />
              )}

              <p className="whitespace-pre-wrap">{selectedEntry.text}</p>
            </div>

            {/* Right Arrow */}
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl disabled:opacity-30"
              disabled={selectedEntryIndex === filteredEntries.length - 1}
              onClick={() =>
                setSelectedEntryIndex((i) => (i !== null ? i + 1 : i))
              }
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
