import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const moods = ["😊", "😢", "😴", "🤒", "😤", "🥰"];

const Journal = () => {
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
                
                <Textarea 
                  placeholder="Write your entry.. (autosaves as draft)" 
                  className="min-h-[150px] rounded-2xl bg-cub-mint-light border-0 resize-none"
                />

                <div className="flex items-center justify-between">
                  <Select>
                    <SelectTrigger className="w-40 rounded-full bg-cub-mint-light border-0">
                      <SelectValue placeholder="Filter by mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((mood) => (
                        <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground">Mood:</span>
                    <div className="flex gap-1">
                      {moods.map((mood) => (
                        <button key={mood} className="text-lg hover:scale-125 transition-transform">
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">0/2000</span>
                  <Button className="rounded-full">Add Entry</Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  • Export if you want backups.<br />
                  Use Import to merge from other devices.
                </p>
              </CardContent>
            </Card>

            {/* Entries List */}
            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <h2 className="font-display font-bold text-xl mb-4">Entries (0)</h2>
                
                <div className="text-center py-12 text-muted-foreground">
                  <p>No entries found — add your first one above</p>
                  <p className="text-sm mt-2">[selected entries will be viewed in the same format]</p>
                </div>

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
