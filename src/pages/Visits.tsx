import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { VisitEvent } from "@/types/visits";
import type { ApiVisit } from "@/lib/api";

import { Calendar } from "react-big-calendar";
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { enUS } from 'date-fns/locale/en-US';

const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), 
  getDay,
  locales,
});

const mapToCalendarEvents = (events: VisitEvent[]) => {
  return events.map(ev => ({
    id: ev.id,
    title: ev.title,
    start: new Date(ev.start_time),
    end: new Date(ev.end_time),
    resource: ev, 
  }));
};

const mapVisitsToEvents = (visits: ApiVisit[]): VisitEvent[] => {
  return visits.map((v) => ({
    id: v.id,
    title: v.notes || "Visit",
    type: "mine", // temporarily assign type until you get it from API
    planId: v.plan_id,
    start_time: v.start_time,
    end_time: v.end_time,
    location: v.location || "",
    status: v.status || "scheduled",
    day: (new Date(v.start_time).getDay() + 6) % 7, // Monday = 0
  }));
};

const Visits = () => {
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
                            alert("Unable to fetch full plan details.");
                            setActivePlan(null);
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
              <div className="border rounded-2xl overflow-hidden p-4">
                <Calendar
                  localizer={localizer}
                  events={mapToCalendarEvents(visibleEvents)}
                  views={['month', 'week', 'day']}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  onSelectEvent={(event) => setSelectedEvent(event.resource)}
                  eventPropGetter={(event) => {
                    const bgColor = event.resource.type === "mine"
                      ? "#3b82f6"
                      : event.resource.type === "theirs"
                      ? "#10b981"
                      : "#9ca3af";
                    return { style: { backgroundColor: bgColor, color: 'white', borderRadius: '0.75rem', padding: '2px 4px', margin: '1px 0' } };
                  }}
                />
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
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          {new Date(selectedEvent.start_time).toLocaleDateString()}
                        </div>

                        <div>
                          <span className="text-muted-foreground">Title / Notes:</span>{" "}
                          {selectedEvent.title}
                        </div>
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
                      type: "mine", // or dynamically if available
                      planId: created.plan_id,
                      start_time: created.start_time,
                      end_time: created.end_time,
                      location: created.location || "",
                      status: created.status || "scheduled",
                      day: (new Date(created.start_time).getDay() + 6) % 7,
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
