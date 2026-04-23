import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { VisitEvent } from "@/types/visits";
import type { PlanInvite } from "@/lib/api";
import { mapVisitsToEvents } from "@/lib/mappers/visitMapper";
import { dateFnsLocalizer, Calendar } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from 'date-fns';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { enUS } from 'date-fns/locale/en-US';
import { DateTime } from "luxon"
import { VisitModal } from "@/components/VisitModal";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const locales = { 'en-US': enUS };
const eventColorMap: Record<VisitEvent["type"], string> = {
                  mine: "bg-cub-blue",
                  theirs: "bg-cub-green",
                  deleted: "bg-gray-400",
                };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), 
  getDay,
  locales,
});

const mapToCalendarEvents = (events: VisitEvent[]) => {
  return events.map(ev => {
    const start = DateTime.fromISO(ev.start_time).toJSDate();
    const end = DateTime.fromISO(ev.end_time).toJSDate();
    return {
      id: ev.id || crypto.randomUUID(), // fallback just in case
      title: ev.title,
      start,
      end,
      resource: ev,   // Keep full event
    };
  });
};

const Visits = () => {
  const [plansOpen, setPlansOpen] = useState(false);
  const { user } = useAuthContext();
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState<string | null>(null);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  type ModalMode = "view" | "edit" | "create" | null;
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalEvent, setModalEvent] = useState<VisitEvent | null>(null);

  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [invites, setInvites] = useState<PlanInvite[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);

  const [events, setEvents] = useState<VisitEvent[]>([]);
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);

  useEffect(() => {
  const fetchChildren = async () => {
    try {
      const allChildren = await api.getChildren();
      const mapped = allChildren.map(child => ({
        id: child.id,
        name: `${child.first_name}${child.last_name ? ` ${child.last_name}` : ""}`,
      }));
      setChildren(mapped);

      if (mapped.length > 0) {
        setSelectedChild(mapped[0]); // default to first child
      } else {
        setSelectedChild(null);
      }
    } catch (err) {
      console.error("Error fetching children:", err);
      setSelectedChild(null);
    } finally {
      setLoadingChildren(false);
    }
  };

  fetchChildren();
}, []);

useEffect(() => {
  const fetchInvites = async () => {
    try {
      const res = await api.getMyInvites();
      setInvites(res.invites ?? []);
    } catch (err) {
      console.error("Failed to load invites:", err);
    }
  };

  fetchInvites();
}, []);

const navigate = useNavigate();

const handleProposalSubmit = async () => {
    setProposalError(null);
    setProposalSuccess(null);

    if (!activePlan) {
      setProposalError("Please select a plan first.");
      return;
    }

    if (!user?.id) {
      setProposalError("Please sign in to submit a proposal.");
      return;
    }

    if (!proposalTitle.trim() || !proposalDescription.trim()) {
      setProposalError("Title and description are required.");
      return;
    }

    try {
      setProposalSubmitting(true);
      await api.createProposal({
        plan_id: activePlan.id,
        title: proposalTitle.trim(),
        description: proposalDescription.trim(),
        created_by: user.id,
      });
      setProposalTitle("");
      setProposalDescription("");
      setProposalSuccess("Proposal submitted for review.");
    } catch (err) {
      setProposalError(err instanceof Error ? err.message : "Failed to submit proposal.");
    } finally {
      setProposalSubmitting(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("plans-dropdown");
      const button = document.getElementById("plans-button");
      if (plansOpen && dropdown && button && !dropdown.contains(event.target as Node) && !button.contains(event.target as Node)) {
        setPlansOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

  return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [plansOpen]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { plans } = await api.getPlans();

        if (!plans?.length) {
          setActivePlan(null);
          navigate("/create-plan");
          return;
        }

        setPlans(plans);

        const full = await api.getPlanById(plans[0].id);
        setActivePlan(full.plan);

      } catch (err) {
        console.error("Failed to load plans:", err);
      }
    };

    fetchPlans();
  }, [navigate]);

  useEffect(() => {
  if (!activePlan) return;if (!activePlan) {
    navigate("/plans/create");
    return;
  }

  const fetchVisits = async () => {
    const { data } = await api.getVisitsByPlan(activePlan.id);
    setEvents(mapVisitsToEvents(data));
  };

  fetchVisits();
}, [activePlan]);

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
              {/* Legend, Plan & Child Selector */}
<div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4 relative">

  {/* Plan Selector */}
  <Button
    id="plans-button"
    variant="outline"
    className="rounded-full flex items-center gap-2"
    onClick={() => setPlansOpen((prev) => !prev)}
  >
    <span>{activePlan?.title || "Select Plan"}</span>
    <Check className="w-4 h-4 text-primary" />
  </Button>

  {plansOpen && Array.isArray(plans) && plans.length > 0 && (
    <div
      id="plans-dropdown"
      className="absolute top-12 left-0 z-10 w-64 bg-card border rounded-2xl shadow-lg overflow-hidden"
    >
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
          {activePlan?.id === plan.id && <Check className="w-4 h-4 text-primary" />}
        </button>
      ))}
    </div>
  )}

    
  {/* Child Selector */}
  {children.length > 0 && (
    <div>
      <label className="block text-sm font-medium mb-1">Child</label>
      <select
        aria-label="child"
        value={selectedChild?.id || ""}
        onChange={(e) => {
          const child = children.find(c => c.id === e.target.value) || null;
          setSelectedChild(child);
        }}
        className="w-48 p-2 border rounded-lg"
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
          </option>
        ))}
      </select>
    </div>
  )}

  {activePlan && activePlan.invites.length > 0 && (
    <div className="mt-2 p-2 text-sm text-muted-foreground border rounded-lg bg-card-light">
      <strong>Invites:</strong>
      <ul className="list-disc list-inside">
        {activePlan.invites.map((invite) => (
          <li key={invite.id}>
            {invite.email} � {invite.status}
          </li>
        ))}
      </ul>
    </div>
  )}
</div>

              {/* Calendar */}
              {invites.length > 0 && (
  <div className="mb-4 p-4 border rounded-2xl bg-yellow-50">
    <p className="font-semibold text-sm mb-2">
      You’ve been invited to join a parenting plan
    </p>

    {invites.map((invite) => (
      <div key={invite.id} className="flex items-center justify-between mb-2">
        <span className="text-sm">{invite.email}</span>

        <Button
          size="sm"
          onClick={async () => {
            try {
              await api.acceptInvite(invite.id);

              // remove from UI
              setInvites((prev) => prev.filter((i) => i.id !== invite.id));

              // refresh plans
              const { plans } = await api.getPlans();
              setPlans(plans);
            } catch (err) {
              alert("Failed to accept invite");
            }
          }}
        >
          Accept
        </Button>
      </div>
    ))}
  </div>
)}
              <div className="border rounded-2xl overflow-hidden p-4">
                <Calendar
                  localizer={localizer}
                  events={mapToCalendarEvents(events)}
                  views={['month', 'week', 'day']}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  onSelectEvent={(event) => {
                    setModalEvent(event.resource);
                    setModalMode("view");
                  }}
                  eventPropGetter={(event) => {
                    const tailwindClass = eventColorMap[event.resource.type] || "bg-gray-400";
                    return {
                      className: tailwindClass + " text-white rounded-lg px-1 py-0.5 m-0.5"
                    };
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
              {modalEvent && modalMode && (
                <VisitModal
                  mode={modalMode}
                  event={modalEvent}
                  onClose={() => setModalMode(null)}
                  onEdit={() => setModalMode("edit")}
                  onSave={async (updatedEvent) => {
  if (!activePlan || !selectedChild || !user?.id) {
  alert("Missing required context (plan, child, or user).");
  return;
}

  // Explicitly handle create vs update
  const isCreate = !updatedEvent.id || updatedEvent.id === "";

  const payload = {
    plan_id: activePlan.id,
    child_id: selectedChild.id,
    parent_id: user.id,
    start_time: updatedEvent.start_time,
    end_time: updatedEvent.end_time,
    location: updatedEvent.location || "",
    notes: updatedEvent.title || "",
    status: updatedEvent.status || "scheduled",
  };

  try {
    let finalEvent: VisitEvent;

    if (isCreate) {
      // CREATE
      const created = await api.createVisit(payload);

      finalEvent = {
        ...updatedEvent,
        id: created.id, // guaranteed backend ID
        title: created.notes || updatedEvent.title || "Visit",
        status: created.status || "scheduled",
      };

      setEvents((prev) => [...prev, finalEvent]);
      setModalEvent(finalEvent);
      setModalMode("view");
    } else {
      // UPDATE
      const updated = await api.updateVisit(updatedEvent.id, payload);

      finalEvent = {
        ...updatedEvent,
        id: updated.id, // ensure using backend ID
        title: updated.notes || updatedEvent.title || "Visit",
        status: updated.status || "scheduled",
        day: (DateTime.fromISO(updatedEvent.start_time).weekday + 6) % 7,
      };

      setEvents((prev) =>
        prev.map((ev) => (ev.id === updatedEvent.id ? finalEvent : ev))
      );
      setModalEvent(finalEvent);
    }
  } catch (err) {
    console.error("Failed to save visit:", err);
    alert("Failed to save visit. Check all fields.");
  }
}}

                  onDelete={async (id) => {
                    try {
                      await api.deleteVisit(id);
                      setEvents((prev) => prev.filter((ev) => ev.id !== id));
                      setModalMode(null);
                      setModalEvent(null);
                    } catch (err) {
                      console.error("Failed to delete visit:", err);
                      alert("Failed to delete visit. Please try again.");
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Add Button */}
          <div className="fixed bottom-8 right-8">
            <Button
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg"
              onClick={() => {
                if (!activePlan) return;

                const now = DateTime.local();
                const start = now.plus({ minutes: 60 - now.minute }).startOf("hour");
                const end = start.plus({ hours: 1 });

                setModalEvent({
                  id: "", // temporary for create
                  planId: activePlan.id,
                  title: "",
                  type: "mine",
                  start_time: start.toISO(),
                  end_time: end.toISO(),
                  location: "",
                  status: "scheduled",
                  day: (start.weekday + 6) % 7,
                });
                setModalMode("create");
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
