import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
} from "lucide-react";
import { useState } from "react";

const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

const mockEvents = [
  { id: 1, title: "Pick up Sophie", day: 1, type: "mine" },
  { id: 2, title: "Shopping with Test Baby", day: 5, type: "theirs" },
  { id: 3, title: "Pick up Sophie", day: 3, type: "deleted", span: 4 },
];

const Visits = () => {
  const [viewMode, setViewMode] = useState<"Month" | "Week">("Month");

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          {/* Page Title */}
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6">Visits</h1>

          {/* Calendar Card */}
          <Card className="rounded-3xl overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "Month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("Month")}
                    className="rounded-full"
                  >
                    Month
                  </Button>
                  <span className="text-muted-foreground">Week</span>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-display font-bold">Nov 2025</span>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Legend & Plan */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-card border rounded-full px-4 py-2">
                  <span>Plan</span>
                  <Check className="w-4 h-4" />
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-7 bg-cub-mint-light">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="text-center py-3 font-display font-bold text-primary border-r last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Body - Simplified */}
                <div className="grid grid-cols-7 min-h-[300px]">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="border-r border-b last:border-r-0 p-2 min-h-[100px]">
                      <span className="text-sm text-muted-foreground">{i + 3}</span>
                      {i === 0 && (
                        <div className="mt-2">
                          <span className="bg-cub-blue text-primary-foreground text-xs px-3 py-1 rounded-full">
                            Pick up Sophie
                          </span>
                        </div>
                      )}
                      {i === 5 && (
                        <div className="mt-2">
                          <span className="bg-cub-green text-primary-foreground text-xs px-3 py-1 rounded-full">
                            Shopping with Test Baby
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-4 pt-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-cub-blue" />
                  <span className="text-sm">My Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-cub-green" />
                  <span className="text-sm">Their Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-gray-400" />
                  <span className="text-sm">Deleted</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Button */}
          <div className="fixed bottom-8 right-8">
            <Button size="lg" className="rounded-full w-14 h-14 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Visits;
