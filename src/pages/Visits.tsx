import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { useState } from "react";

const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

type VisitEvent = {
  id: number;
  title: string;
  day: number; // 0–6 (Mon–Sun)
  type: "mine" | "theirs" | "deleted";
  planId: number;
};

const mockEvents: VisitEvent[] = [
  // Weekday / Weekend Split
  { id: 1, title: "Pick up Sophie", day: 0, type: "mine", planId: 1 },
  { id: 2, title: "Drop off Sophie", day: 4, type: "theirs", planId: 1 },

  // Alternating Weeks
  { id: 3, title: "Week with Mom", day: 1, type: "mine", planId: 2 },
  { id: 4, title: "Week with Dad", day: 5, type: "theirs", planId: 2 },

  // School Term Only
  { id: 5, title: "School Pickup", day: 2, type: "mine", planId: 3 },
];

type Plan = {
  id: number;
  name: string;
};

const mockPlans: Plan[] = [
  { id: 1, name: "Weekday / Weekend Split" },
  { id: 2, name: "Alternating Weeks" },
  { id: 3, name: "School Term Only" },
];

const Visits = () => {
  const [viewMode, setViewMode] = useState<"Month" | "Week">("Month");
  const [plansOpen, setPlansOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<Plan>(mockPlans[0]);
  const [selectedEvent, setSelectedEvent] = useState<VisitEvent | null>(null);
  const [editEvent, setEditEvent] = useState<VisitEvent | null>(null);

  const visibleEvents = mockEvents.filter(
    (event) => event.planId === activePlan.id
  );

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
                  <Button
                    variant={viewMode === "Week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("Week")}
                    className="rounded-full"
                  >
                    Week
                  </Button>
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
              <div className="flex items-center gap-4 mb-4 relative">
                <Button
                  variant="outline"
                  className="rounded-full flex items-center gap-2"
                  onClick={() => setPlansOpen((prev) => !prev)}
                >
                  <span>{activePlan.name}</span>
                  <Check className="w-4 h-4 text-primary" />
                </Button>

                {plansOpen && (
                  <div className="absolute top-12 left-0 z-10 w-64 bg-card border rounded-2xl shadow-lg overflow-hidden">
                    {mockPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => {
                          setActivePlan(plan);
                          setPlansOpen(false);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted text-left"
                      >
                        <span className="text-sm">{plan.name}</span>
                        {activePlan.id === plan.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Calendar */}
              {viewMode === "Month" && (
                <div className="border rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-7 bg-cub-mint-light">
                    {daysOfWeek.map((day) => (
                      <div
                        key={day}
                        className="text-center py-3 font-display font-bold text-primary border-r last:border-r-0"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-7 min-h-[300px]">
                    {[...Array(7)].map((_, i) => {
                      const dayEvents = visibleEvents.filter(
                        (event) => event.day === i
                      );

                      return (
                        <div
                          key={i}
                          className="border-r border-b last:border-r-0 p-2 min-h-[100px]"
                        >
                          <span className="text-sm text-muted-foreground">{i + 3}</span>

                          <div className="mt-2 space-y-1">
                            {dayEvents.map((event) => (
                              <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`block w-full text-left text-xs px-3 py-1 rounded-full ${
                                  event.type === "mine"
                                    ? "bg-cub-blue text-primary-foreground"
                                    : event.type === "theirs"
                                    ? "bg-cub-green text-primary-foreground"
                                    : "bg-gray-400 text-white"
                                }`}
                              >
                                {event.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === "Week" && (
                <div className="border rounded-2xl divide-y">
                  {daysOfWeek.map((day, i) => {
                    const dayEvents = visibleEvents.filter(
                      (event) => event.day === i
                    );

                    return (
                      <div key={day} className="p-4">
                        <h3 className="font-display font-bold text-primary mb-2">
                          {day}
                        </h3>

                        {dayEvents.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            No events
                          </span>
                        ) : (
                          <div className="space-y-2">
                            {dayEvents.map((event) => (
                              <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`w-full text-left px-4 py-2 rounded-xl text-sm ${
                                  event.type === "mine"
                                    ? "bg-cub-blue text-primary-foreground"
                                    : event.type === "theirs"
                                    ? "bg-cub-green text-primary-foreground"
                                    : "bg-gray-400 text-white"
                                }`}
                              >
                                {event.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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
              {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-xl font-bold text-primary">
                        {selectedEvent.title}
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEvent(null)}
                      >
                        ✕
                      </Button>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Plan:</span>{" "}
                        {activePlan.name}
                      </div>

                      <div>
                        <span className="text-muted-foreground">Day:</span>{" "}
                        {daysOfWeek[selectedEvent.day]}
                      </div>

                      <div>
                        <span className="text-muted-foreground">Type:</span>{" "}
                        {selectedEvent.type === "mine"
                          ? "My event"
                          : selectedEvent.type === "theirs"
                          ? "Their event"
                          : "Deleted"}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-2">
                      <Button
                        className="w-full rounded-full"
                        onClick={() => setEditEvent(selectedEvent)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => alert("Propose change feature coming soon")}
                      >
                        Propose change
                      </Button>
                    </div>

                    {/* Edit Modal */}
                    {editEvent && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="font-display text-xl font-bold text-primary">Edit Event</h2>
                            <Button variant="ghost" size="icon" onClick={() => setEditEvent(null)}>✕</Button>
                          </div>

                          {/* Title */}
                          <input
                            type="text"
                            aria-label="Event Title"
                            className="w-full p-2 border rounded mb-4"
                            value={editEvent.title}
                            onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                          />

                          {/* Day */}
                          <label className="block mb-1 text-sm font-medium" htmlFor="edit-day">Day</label>
                          <select
                            id="edit-day"
                            className="w-full p-2 border rounded mb-4"
                            value={editEvent.day}
                            onChange={(e) => setEditEvent({ ...editEvent, day: Number(e.target.value) })}
                          >
                            {daysOfWeek.map((day, index) => (
                              <option key={day} value={index}>{day}</option>
                            ))}
                          </select>

                          {/* Type */}
                          <label className="block mb-1 text-sm font-medium" htmlFor="edit-type">Type</label>
                          <select
                            id="edit-type"
                            className="w-full p-2 border rounded mb-4"
                            value={editEvent.type}
                            onChange={(e) => setEditEvent({ ...editEvent, type: e.target.value as VisitEvent["type"] })}
                          >
                            <option value="mine">My event</option>
                            <option value="theirs">Their event</option>
                            <option value="deleted">Deleted</option>
                          </select>


                          <Button
                            className="w-full rounded-full"
                            onClick={() => {
                              // Update the main visible events array
                              const index = mockEvents.findIndex((ev) => ev.id === editEvent.id);
                              if (index !== -1) {
                                mockEvents[index] = { ...editEvent };
                              }

                              setSelectedEvent(editEvent); // update modal
                              setEditEvent(null); // close edit modal
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
