import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { VisitEvent } from "@/types/visits";
import type { ApiVisit } from "@/lib/api";

const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const mapVisitsToEvents = (rows: ApiVisit[]): VisitEvent[] => {
  return rows.map((v) => ({
    id: v.id,
    title: v.notes || "Visit",
    day: (new Date(v.start_time).getDay() + 6) % 7,
    type: "mine", 
    planId: v.plan_id,
    start_time: v.start_time,
    end_time: v.end_time,
    location: v.location,
    status: v.status,
  }));
};

const Visits = () => {
  const [viewMode, setViewMode] = useState<"Month" | "Week">("Month");
  const [plansOpen, setPlansOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<VisitEvent | null>(null);
  const [editEvent, setEditEvent] = useState<VisitEvent | null>(null);

  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);

  const [events, setEvents] = useState<VisitEvent[]>([]);


  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { plans } = await api.getPlans();
        setPlans(plans);

        if (plans[0]) {
          // Fetch full plan for the first plan
          const { plan: fullPlan } = await api.getPlanById(plans[0].id);
          setActivePlan(fullPlan);
        } else {
          setActivePlan(null);
        }
      } catch (err) {
        console.error("Failed to load plans:", err);
        alert("Unable to load plans. Please refresh or login again.");
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
  if (!activePlan) return;

  const fetchVisits = async () => {
    const { data } = await api.getVisitsByPlan(activePlan.id);
    setEvents(mapVisitsToEvents(data));
  };

  fetchVisits();
}, [activePlan]);

  // Compute visible events for calendar
  const visibleEvents = events.filter(event => event.planId === activePlan?.id);

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
                  <span>{activePlan?.title || "Select Plan"}</span>
                  <Check className="w-4 h-4 text-primary" />
                </Button>

                {plansOpen && Array.isArray(plans) && plans.length > 0 && (
                  <div className="absolute top-12 left-0 z-10 w-64 bg-card border rounded-2xl shadow-lg overflow-hidden">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={async () => {
                          setPlansOpen(false);

                          try {
                            const { plan: fullPlan } = await api.getPlanById(plan.id);
                            setActivePlan(fullPlan);
                          } catch (err) {
                            console.error("Failed to fetch full plan:", err);
                            alert("Unable to fetch full plan details. Showing basic plan info.");
                            setActivePlan({
                              ...plan,
                              description: "",
                              start_date: "",
                              end_date: "",
                              status: "",
                              created_by: "",
                              created_at: "",
                              invites: [],
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-muted text-left ${
                          activePlan?.id === plan.id ? "bg-muted" : ""
                        }`}
                      >
                        <span className="text-sm">{plan.title}</span>
                        {activePlan?.id === plan.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                    {activePlan && activePlan.invites.length > 0 && (
                      <div className="mt-2 p-2 text-sm text-muted-foreground border rounded-lg bg-card-light">
                        <strong>Invites:</strong>
                        <ul className="list-disc list-inside">
                          {activePlan.invites.map((invite) => (
                            <li key={invite.id}>
                              {invite.email} — {invite.status}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                        {activePlan?.title}
                      </div>

                      <div>
                        <span className="text-muted-foreground">Day:</span>{" "}
                        {daysOfWeek[selectedEvent.day]}
                      </div>

                      <div>
                        <span className="text-muted-foreground">Title / Notes:</span>{" "}
                        {selectedEvent.title}
                      </div>

                      {selectedEvent.location && (
                        <div>
                          <span className="text-muted-foreground">Location:</span>{" "}
                          {selectedEvent.location}
                        </div>
                      )}

                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        {selectedEvent.status}
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
                            onClick={async () => {
                              if (!editEvent) return;

                              try {
                                await api.updateVisit(editEvent.id, {
                                  start_time: editEvent.start_time,
                                  end_time: editEvent.end_time,
                                  location: editEvent.location,
                                  notes: editEvent.title, 
                                  status: editEvent.status,
                                });

                                // Update UI
                                setEvents((prev) =>
                                  prev.map((ev) => (ev.id === editEvent.id ? editEvent : ev))
                                );
                                setSelectedEvent(editEvent);
                                setEditEvent(null);
                              } catch (err) {
                                console.error("Failed to update visit:", err);
                                alert("Failed to update visit. Please try again.");
                              }
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
            <Button
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg"
              onClick={async () => {
                if (!activePlan) return;

                // Set start/end times
                const start = new Date();
                start.setHours(9, 0, 0, 0);

                const end = new Date(start);
                end.setHours(10, 0, 0, 0);

                try {
                  const created = await api.createVisit({
                    plan_id: activePlan.id,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                  });

                  // Add to UI
                  setEvents((prev) => [
                    ...prev,
                    {
                      id: created.id,
                      title: created.notes || "Visit",
                      day: (new Date(created.start_time).getDay() + 6) % 7,
                      type: "mine",
                      planId: created.plan_id,
                      start_time: created.start_time,
                      end_time: created.end_time,
                      location: created.location || "",
                      status: created.status || "scheduled",
                    },
                  ]);
                } catch (err) {
                  console.error("Failed to create visit:", err);
                  alert("Failed to create visit. Please try again.");
                }
              }}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Visits;
