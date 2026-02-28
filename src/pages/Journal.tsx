import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { JournalEntry } from "@/types/journal";
import * as api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ViewJournalModal from "@/components/ViewJournalModal";

const moods = ["😊", "😢", "😴", "🤒", "😤", "🥰"];

const Journal = () => {
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);

  const [selectedMood, setSelectedMood] = useState<string>(""); 
  const [entryTitle, setEntryTitle] = useState("");
  const [entryText, setEntryText] = useState(""); 
  const [entryImage, setEntryImage] = useState<string | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const maxChars = 2000;
  const [viewMode, setViewMode] = useState<"all" | "received" | "sent">("all");
  const { user } = useAuth();

  const filteredEntries = entries.filter(
    (entry) => viewMode === "all" || entry.type === viewMode
  );

  const selectedEntry =
    selectedEntryIndex !== null ? filteredEntries[selectedEntryIndex] : null;

    // Fetch plans & resolve first child
    useEffect(() => {
      const fetchPlans = async () => {
        const { plans } = await api.getPlans();
        setPlans(plans);

        if (plans[0]) {
          const { plan: fullPlan } = await api.getPlanById(plans[0].id);
          setActivePlan(fullPlan);

          const firstChild = fullPlan.children?.[0] || null;
          if (firstChild) setSelectedChild({ id: firstChild.id, name: firstChild.name });
        }
      };
      fetchPlans();
    }, []);

    useEffect(() => {
      const fetchEntries = async () => {
        if (!selectedChild) return;
        const apiEntries = await api.getJournalEntriesByChild(selectedChild.id);

        setEntries(
          apiEntries.map((e) => ({
            ...e,
            type: e.author_id === user?.id ? "sent" : "received",
          }))
        );

      };
      fetchEntries();
    }, [selectedChild]);

    useEffect(() => {
    if (!activePlan) return;

    const fetchChildren = async () => {
      try {
        const allChildren = await api.getChildren(); // now returns Child[]
        
        setChildren(
          allChildren.map((child) => ({
            id: child.id,
            name: `${child.first_name}${child.last_name ? ` ${child.last_name}` : ""}`,
          }))
        );

        if (allChildren.length > 0) {
          setSelectedChild({
            id: allChildren[0].id,
            name: `${allChildren[0].first_name}${allChildren[0].last_name ? ` ${allChildren[0].last_name}` : ""}`,
          });
        }
      } catch (err) {
        console.error("Failed to fetch children:", err);
      }
    };

    fetchChildren();
  }, [activePlan]);

    // Add Journal Entry
    const addJournalEntry = async () => {
      console.log("Add Entry clicked");

      if (!user) {
        console.warn("Blocked: no user");
        return;
      }

      if (!activePlan) {
        console.warn("Blocked: no activePlan");
        return;
      }

      if (!selectedChild) {
        console.warn("Blocked: no selectedChild");
        return;
      }

      if (!entryText.trim()) {
        console.warn("Blocked: empty entryText");
        return;
      }

      try {
        const created = await api.createJournalEntry({
          plan_id: activePlan.id,
          child_id: selectedChild.id,
          author_id: user.id,
          content: entryText,
          title: entryTitle || undefined,
          mood: selectedMood || undefined,
          image: entryImage || undefined,
          entry_date: new Date().toISOString(),
        });

        console.log("Journal entry created:", created);

        setEntries((prev) => [
          ...prev,
          { ...created, type: "sent" },
        ]);

        setEntryTitle("");
        setEntryText("");
        setSelectedMood("");
        setEntryImage(null);
      } catch (err) {
        console.error("Failed to create journal entry:", err);
        alert("Failed to save journal entry. Check console.");
      }
    };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-2">
            My Little Journal
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Secure, child-specific journal entries linked to your parenting plan.
          </p>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Entry Form */}
            <Card className="rounded-3xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-display font-bold text-xl">Journal</h2>

                {/* Child Selector */}
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">
                    Select Child
                  </label>

                  <select
                    aria-label="Choose-Child"
                    value={selectedChild?.id || ""}
                    onChange={(e) => {
                      const child = children.find(c => c.id === e.target.value);
                      if (child) setSelectedChild(child);
                    }}
                    className="w-full rounded-full px-4 py-2 bg-cub-mint-light border-0 text-sm focus:outline-none"
                  >
                    <option value="" disabled>Choose a child</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
                
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
                    onClick={addJournalEntry}
                    disabled={!selectedChild}
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
                          <p className="whitespace-pre-wrap">{entry.content}</p>
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

      <ViewJournalModal
        isOpen={selectedEntry !== null}
        entry={selectedEntry}
        onClose={() => setSelectedEntryIndex(null)}
        onPrev={
          selectedEntryIndex !== null
            ? () => setSelectedEntryIndex(selectedEntryIndex - 1)
            : undefined
        }
        onNext={
          selectedEntryIndex !== null
            ? () => setSelectedEntryIndex(selectedEntryIndex + 1)
            : undefined
        }
        disablePrev={selectedEntryIndex === 0}
        disableNext={selectedEntryIndex === filteredEntries.length - 1}
        onUpdate={(updatedEntry) => {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === updatedEntry.id ? { ...updatedEntry, type: e.type } : e
            )
          );
        }}
        onDelete={(id) => {
          setEntries((prev) => prev.filter((e) => e.id !== id));
          setSelectedEntryIndex(null);
        }}
      />
    </div>
  );
};

export default Journal;
