import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import { AddChildModal } from "@/components/AddChildModal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const locales = { 'en-US': enUS };
const eventColorMap: Record<VisitEvent["type"], string> = {
                  mine: "bg-[#85B3E0]",
                  theirs: "bg-[#59C084]",
                  deleted: "bg-[#9CA3AF]",
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
      id: ev.id,
      title: ev.title,
      start,
      end,
      resource: ev,   // Keep full event
    };
  });
};

const formatRequestDateTime = (value: unknown): string | null => {
  if (typeof value !== "string" || !value) return null;
  const dt = DateTime.fromISO(value);
  return dt.isValid ? dt.toFormat("dd LLL yyyy, hh:mm a") : value;
};

const getVisitRequestSummary = (request: api.VisitChangeRequest): string => {
  if (request.request_type === "create") {
    return "Requested creation of a new visit.";
  }

  if (request.request_type === "delete") {
    return "Requested deletion of this visit.";
  }

  const proposed =
    request.proposed_data && typeof request.proposed_data === "object"
      ? (request.proposed_data as Record<string, unknown>)
      : {};

  const parts: string[] = [];
  const start = formatRequestDateTime(proposed.start_time);
  const end = formatRequestDateTime(proposed.end_time);
  if (start) parts.push(`Start: ${start}`);
  if (end) parts.push(`End: ${end}`);
  if (typeof proposed.location === "string" && proposed.location.trim()) {
    parts.push(`Location: ${proposed.location.trim()}`);
  }
  if (typeof proposed.status === "string" && proposed.status.trim()) {
    parts.push(`Status: ${proposed.status.trim()}`);
  }
  if (typeof proposed.notes === "string" && proposed.notes.trim()) {
    const notes =
      proposed.notes.length > 100
        ? `${proposed.notes.slice(0, 97)}...`
        : proposed.notes;
    parts.push(`Notes: ${notes}`);
  }

  return parts.length > 0 ? parts.join(" • ") : "Requested changes to visit details.";
};

const Visits = () => {
  const queryClient = useQueryClient();
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
  const [pendingVisitRequests, setPendingVisitRequests] = useState<api.VisitChangeRequest[]>([]);
  const [mediationRequest, setMediationRequest] = useState<api.MediationRequest | null>(null);
  const [mediationNotes, setMediationNotes] = useState("");
  const [mediationLoading] = useState(false);
  const [mediatorDirectory] = useState<api.ListedMediator[]>([]);
  const [mediatorDirectoryLoading] = useState(false);
  const [selectedMediatorId, setSelectedMediatorId] = useState<string>("");
  const [inviteMediatorEmail, setInviteMediatorEmail] = useState("");

  const [events, setEvents] = useState<VisitEvent[]>([]);
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const { toast } = useToast();

  const markVisitAsDeleted = useCallback((visitId: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === visitId
          ? {
              ...event,
              type: "deleted",
              status: "cancelled",
            }
          : event,
      ),
    );
  }, []);

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
      // prevent UI crash on 500
      console.warn("Invites endpoint failed (non-blocking):", err);
      setInvites([]);
    }
  };

  fetchInvites();
}, []);

const navigate = useNavigate();
const isPlanCreator = Boolean(user?.id && activePlan?.created_by === user.id);

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
        const plans = await queryClient.fetchQuery({
          queryKey: ["plans"],
          queryFn: async () => {
            const res = await api.getPlans();
            return res.plans ?? [];
          },
          staleTime: 60_000,
        });

        if (!plans?.length) {
          setActivePlan(null);
          return;
        }

        setPlans(plans);

        const storedPlanId = (() => {
          try {
            return localStorage.getItem("active_plan_id") ?? "";
          } catch {
            return "";
          }
        })();
        const selectedId =
          (storedPlanId && plans?.some((p) => p.id === storedPlanId) ? storedPlanId : plans?.[0]?.id) ?? "";

        if (selectedId) {
          const full = await queryClient.fetchQuery({
            queryKey: ["plan", selectedId],
            queryFn: () => api.getPlanById(selectedId),
            staleTime: 2 * 60_000,
          });
          try {
            localStorage.setItem("active_plan_id", selectedId);
          } catch {
            // ignore
          }
          setActivePlan(full.plan);
        } else {
          setActivePlan(null);
        }

      } catch (err) {
        console.error("Failed to load plans:", err);
      }
    };

    fetchPlans();
  }, [navigate]);

const refreshVisits = useCallback(async () => {
  if (!activePlan?.id) {
    setEvents([]);
    return;
  }

  try {
    const { data } = await queryClient.fetchQuery({
      queryKey: ["visits", activePlan.id, "includeDeleted"],
      queryFn: () => api.getVisitsByPlan(activePlan.id, { includeDeleted: true }),
      staleTime: 30_000,
    });
    setEvents(mapVisitsToEvents(data, user?.id));
  } catch (err) {
    console.warn("Failed to fetch visits:", err);
  }
}, [activePlan?.id, user?.id, queryClient]);

useEffect(() => {
  void refreshVisits();
}, [refreshVisits]);

const fetchPendingRequests = useCallback(async () => {
  const planIds = Array.from(
    new Set([
      ...plans.map((plan) => plan.id),
      ...(activePlan?.id ? [activePlan.id] : []),
    ]),
  );

  if (planIds.length === 0) {
    setPendingVisitRequests([]);
    return;
  }

  try {
    const requestLists = await Promise.all(
      planIds.map(async (planId) => {
        try {
          return await api.getPendingVisitRequests(planId);
        } catch (err) {
          console.warn(`Failed to fetch pending visit requests for plan ${planId}:`, err);
          return [];
        }
      }),
    );

    const merged = requestLists.flat();
    const deduped = Array.from(new Map(merged.map((request) => [request.id, request])).values());
    setPendingVisitRequests(deduped);
  } catch (err) {
    console.warn("Failed to fetch pending visit requests:", err);
    setPendingVisitRequests([]);
  }
}, [activePlan?.id, plans]);

const refreshAfterDecision = useCallback(async () => {
  await Promise.all([refreshVisits(), fetchPendingRequests()]);
}, [refreshVisits, fetchPendingRequests]);

useEffect(() => {
  void fetchPendingRequests();
}, [fetchPendingRequests]);

useEffect(() => {
  if (!activePlan?.id) return;

  const pollIntervalMs = 20000;
  const intervalId = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      void fetchPendingRequests();
    }
  }, pollIntervalMs);

  const handleFocus = () => {
    void fetchPendingRequests();
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      void fetchPendingRequests();
    }
  };

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}, [activePlan?.id, fetchPendingRequests]);

  if (!activePlan) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <Navbar />
        <main className="flex-1 py-8 px-4">
          <div className="container max-w-3xl mx-auto">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>No plan yet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create a parenting plan first to start tracking visits and requests.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild className="rounded-full">
                    <Link to="/">Go to Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/create-plan">Create plan</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-4 px-0 sm:py-8 sm:px-4">
        <div className="container max-w-none sm:max-w-5xl mx-auto px-0">
          {/* Page Title */}
          <h1 className="font-display text-3xl font-bold text-primary text-center mb-6 hidden sm:block">
            Visits
          </h1>

          {/* Calendar Card */}
          <Card className="rounded-none sm:rounded-3xl overflow-hidden border-0 shadow-none sm:shadow-sm">
            <CardContent className="pt-4 px-0 sm:px-6">
              {/* Legend, Plan & Child Selector */}
<div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4 relative">

  {/* Plan Selector */}
  <Button
    id="plans-button"
    variant="outline"
    className="w-full sm:w-auto rounded-full flex items-center gap-2"
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
              const { plan: fullPlan } = await queryClient.fetchQuery({
                queryKey: ["plan", plan.id],
                queryFn: () => api.getPlanById(plan.id),
                staleTime: 2 * 60_000,
              });
              try {
                localStorage.setItem("active_plan_id", plan.id);
              } catch {
                // ignore
              }
              setActivePlan(fullPlan);
            } catch (err) {
              console.error("Failed to fetch full plan:", err);
              toast({
                title: "Failed to load plan",
                description: "Unable to fetch full plan details.",
                variant: "destructive",
              });
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
  <div className="flex items-end gap-2 relative z-10">
    <div>
      <label className="block text-sm font-medium mb-1">Child</label>
      <select
        aria-label="child"
        value={selectedChild?.id || ""}
        onChange={(e) => {
          const child = children.find(c => c.id === e.target.value) || null;
          setSelectedChild(child);
        }}
        className="w-full sm:w-48 p-2 border rounded-lg"
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
          </option>
        ))}
      </select>
    </div>

    <Button
      size="sm"
      className="rounded-full bg-primary text-white hover:bg-primary/90 shadow-sm"
      onClick={() => setShowAddChild(true)}
    >
      + Add
    </Button>
  </div>

  {isPlanCreator && activePlan && activePlan.invites.length > 0 && (
    <div className="mt-2 p-2 text-sm text-muted-foreground border rounded-lg bg-card-light">
      <strong>Invites:</strong>
      <ul className="list-disc list-inside">
        {activePlan.invites.map((invite) => (
          <li key={invite.id}>
            {invite.email} - {invite.status}
          </li>
        ))}
      </ul>
    </div>
  )}

  {activePlan && (
    <div className="mt-2 p-3 border rounded-2xl bg-card w-full md:w-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">Mediator</p>
          <p className="text-xs text-muted-foreground">Manage mediator oversight from the Mediator page.</p>
        </div>

        <Button asChild size="sm" variant="outline">
          <Link to="/mediator">Open</Link>
        </Button>
      </div>

      {false && (
        <div className="mt-3">
          <label className="block text-xs font-medium mb-1 text-muted-foreground">Choose from directory</label>
          <select
            value={selectedMediatorId}
            onChange={(e) => {
              setSelectedMediatorId(e.target.value);
              if (e.target.value) setInviteMediatorEmail("");
            }}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            disabled={mediationLoading || mediatorDirectoryLoading}
          >
            <option value="">{mediatorDirectoryLoading ? "Loading…" : "Select a mediator"}</option>
            {mediatorDirectory.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.display_name}
                {m.city ? ` • ${m.city}` : ""}
                {m.province ? `, ${m.province}` : ""}
              </option>
            ))}
          </select>

          <label className="block text-xs font-medium mt-3 mb-1 text-muted-foreground">Or invite by email</label>
          <input
            value={inviteMediatorEmail}
            onChange={(e) => {
              setInviteMediatorEmail(e.target.value);
              if (e.target.value) setSelectedMediatorId("");
            }}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            placeholder="mediator@example.com"
            disabled={mediationLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            If they don’t have an account yet, they can register and then accept the request from their Mediator dashboard.
          </p>

          <label className="block text-xs font-medium mb-1 text-muted-foreground">Optional note</label>
          <textarea
            value={mediationNotes}
            onChange={(e) => setMediationNotes(e.target.value)}
            className="w-full min-h-20 px-3 py-2 rounded-lg border bg-background text-sm"
            placeholder="Briefly explain what you need help with…"
            disabled={mediationLoading}
          />
        </div>
      )}
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
              toast({
                title: "Invite acceptance failed",
                description: "Please try again.",
                variant: "destructive",
              });
            }
          }}
        >
          Accept
        </Button>
      </div>
    ))}
  </div>
)}
              {pendingVisitRequests.length > 0 && (
  <div className="mb-4 p-4 border rounded-2xl bg-blue-50">
    <p className="font-semibold text-sm mb-2">Visit changes awaiting your decision</p>

    {pendingVisitRequests.map((request) => (
      <div key={request.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3 last:mb-0">
        <div className="text-sm">
          <p className="font-medium">
            {request.request_type === "create"
              ? "Visit create request"
              : request.request_type === "update"
              ? "Visit update request"
              : "Visit delete request"}
          </p>
          <p className="text-muted-foreground">{getVisitRequestSummary(request)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={async () => {
              try {
                const result = await api.reviewVisitRequest(request.id, "approved");

                if (request.request_type === "create" && result.data && "plan_id" in result.data) {
                  const created = result.data as api.ApiVisit;
                  const mapped = mapVisitsToEvents([created], user?.id)[0];
                  if (mapped) {
                    setEvents((prev) => {
                      if (prev.some((event) => event.id === mapped.id)) return prev;
                      return [...prev, mapped];
                    });
                  }
                } else if (request.request_type === "update" && result.data && "plan_id" in result.data) {
                  const updated = result.data as api.ApiVisit;
                  const mapped = mapVisitsToEvents([updated], user?.id)[0];
                  if (mapped) {
                    setEvents((prev) => prev.map((ev) => (ev.id === mapped.id ? mapped : ev)));
                  }
                } else if (request.request_type === "delete" && result.data && "id" in result.data) {
                  const deleted = result.data as { id: string; is_deleted: boolean };
                  markVisitAsDeleted(deleted.id);
                }

                setPendingVisitRequests((prev) => prev.filter((r) => r.id !== request.id));
                await refreshAfterDecision();
                toast({
                  title: "Request approved",
                  description:
                    request.request_type === "create"
                      ? "The visit was created."
                      : request.request_type === "delete"
                      ? "The visit was deleted."
                      : "The visit was updated.",
                });
              } catch (err) {
                console.error("Failed to approve visit request:", err);
                toast({
                  title: "Approval failed",
                  description: "Failed to approve request.",
                  variant: "destructive",
                });
              }
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await api.reviewVisitRequest(request.id, "rejected");
                setPendingVisitRequests((prev) => prev.filter((r) => r.id !== request.id));
                await refreshAfterDecision();
                toast({ title: "Request rejected" });
              } catch (err) {
                console.error("Failed to reject visit request:", err);
                toast({
                  title: "Rejection failed",
                  description: "Failed to reject request.",
                  variant: "destructive",
                });
              }
            }}
          >
            Reject
          </Button>
        </div>
      </div>
    ))}
  </div>
)}
              <div className="overflow-hidden px-0 sm:px-0">
                <Calendar
                  localizer={localizer}
                  events={mapToCalendarEvents(events)}
                  views={['month', 'week', 'day']}
                  startAccessor="start"
                  endAccessor="end"
                  className="cub-rbc"
                  style={{ height: "min(600px, calc(100vh - 260px))", width: "100%" }}
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
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 px-3 sm:px-0 pt-4">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-[#85B3E0]" />
                  <span className="text-sm">My Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-[#59C084]" />
                  <span className="text-sm">Their Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-[#9CA3AF]" />
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
  toast({
    title: "Missing required data",
    description: "Plan, child, or user is missing.",
    variant: "destructive",
  });
  return;
}

  // Explicitly handle create vs update
  const isCreate = !updatedEvent.id || updatedEvent.id === "";

  const createPayload = {
    plan_id: activePlan.id,
    child_id: selectedChild.id,
    parent_id: user.id,
    start_time: updatedEvent.start_time,
    end_time: updatedEvent.end_time,
    location: updatedEvent.location || "",
    notes: updatedEvent.title || "",
    status: updatedEvent.status || "scheduled",
  };
  const updatePayload = {
    start_time: updatedEvent.start_time,
    end_time: updatedEvent.end_time,
    location: updatedEvent.location || "",
    notes: updatedEvent.title || "",
    status: updatedEvent.status || "scheduled",
  };

  try {
    let finalEvent: VisitEvent;

    if (isCreate) {
      const createResult = await api.requestVisitCreate(createPayload);
      if (createResult.mode === "pending") {
        setModalMode(null);
        setModalEvent(null);
        toast({
          title: "Create request sent",
          description: "Waiting for the other parent to approve.",
        });
        return;
      }

      const mappedCreated = mapVisitsToEvents([createResult.data], user.id)[0];
      finalEvent = mappedCreated ?? {
        ...updatedEvent,
        id: createResult.data.id,
        title: createResult.data.notes || updatedEvent.title || "Visit",
        status: createResult.data.status || "scheduled",
      };

      finalEvent = {
        ...finalEvent,
        type: updatedEvent.type === "theirs" ? "theirs" : "mine",
      };

      setEvents((prev) => [...prev, finalEvent]);
      setModalEvent(finalEvent);
      setModalMode("view");
    } else {
      const updateResult = await api.requestVisitEdit(updatedEvent.id, updatePayload);

      if (updateResult.mode === "pending") {
        setModalMode(null);
        setModalEvent(null);
        toast({
          title: "Edit request sent",
          description: "Waiting for the other parent to approve.",
        });
        return;
      }

      const mappedUpdated = mapVisitsToEvents([updateResult.data], user.id)[0];
      finalEvent = mappedUpdated ?? {
        ...updatedEvent,
        id: updateResult.data.id,
        title: updateResult.data.notes || updatedEvent.title || "Visit",
        status: updateResult.data.status || "scheduled",
        day: (DateTime.fromISO(updatedEvent.start_time).weekday + 6) % 7,
      };

      finalEvent = {
        ...finalEvent,
        type: updatedEvent.type === "theirs" ? "theirs" : "mine",
      };

      setEvents((prev) => prev.map((ev) => (ev.id === updatedEvent.id ? finalEvent : ev)));
      setModalEvent(finalEvent);
    }
  } catch (err) {
    console.error("Failed to save visit:", err);
    toast({
      title: "Failed to save visit",
      description: "Check all fields and try again.",
      variant: "destructive",
    });
  }
}}

                  onDelete={async (id) => {
                    try {
                      const result = await api.requestVisitDelete(id);
                      if (result.mode === "pending") {
                        setModalMode(null);
                        setModalEvent(null);
                        toast({
                          title: "Delete request sent",
                          description: "Waiting for the other parent to approve.",
                        });
                        return;
                      }

                      markVisitAsDeleted(result.data.id);
                      setModalEvent((prev) =>
                        prev && prev.id === result.data.id
                          ? {
                              ...prev,
                              type: "deleted",
                              status: "cancelled",
                            }
                          : prev,
                      );
                      setModalMode("view");
                    } catch (err) {
                      console.error("Failed to delete visit:", err);
                      toast({
                        title: "Failed to delete visit",
                        description: "Please try again.",
                        variant: "destructive",
                      });
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
      {showAddChild && (
        <AddChildModal
          planId={activePlan?.id ?? null}
          onClose={() => setShowAddChild(false)}
          onCreated={async () => {
            // refresh children after creation
            const allChildren = await api.getChildren();

            const mapped = allChildren.map(child => ({
              id: child.id,
              name: `${child.first_name}${child.last_name ? ` ${child.last_name}` : ""}`,
            }));

            setChildren(mapped);

            if (mapped.length > 0) {
              setSelectedChild(mapped[0]);
            }
          }}
        />
      )}
    </div>
  );
};

export default Visits;
