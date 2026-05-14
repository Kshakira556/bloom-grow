import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import * as api from "@/lib/api";

const formatDateTime = (value: string) => format(new Date(value), "yyyy-MM-dd HH:mm");

const MediatorSchedule = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCaseId = searchParams.get("case") || "all";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedPlans, setAssignedPlans] = useState<api.ModeratorAssignedPlanWithClients[]>([]);
  const [sessions, setSessions] = useState<api.MediatorSession[]>([]);

  const [newStartsAt, setNewStartsAt] = useState("");
  const [newMode, setNewMode] = useState<api.MediatorSessionMode>("online");
  const [newLocation, setNewLocation] = useState("");
  const [newAgenda, setNewAgenda] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const plans = await api.getMyModeratorAssignedPlansWithClients();
        setAssignedPlans(plans);

        const upcoming = await api.getMyMediatorSessions({
          plan_id: selectedCaseId === "all" ? undefined : selectedCaseId,
          limit: 200,
        });
        setSessions(upcoming);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedCaseId]);

  const planTitleById = useMemo(() => {
    return assignedPlans.reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = p.title;
      return acc;
    }, {});
  }, [assignedPlans]);

  const upcomingSessions = useMemo(() => {
    const now = Date.now();
    return sessions
      .filter((s) => new Date(s.starts_at).getTime() >= now - 7 * 24 * 60 * 60 * 1000)
      .slice()
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [sessions]);

  const createSession = async () => {
    try {
      setError(null);
      if (selectedCaseId === "all") {
        setError("Select a case to schedule a session.");
        return;
      }
      if (!newStartsAt) {
        setError("Start date/time is required.");
        return;
      }

      const session = await api.createMyMediatorSession({
        plan_id: selectedCaseId,
        starts_at: new Date(newStartsAt).toISOString(),
        mode: newMode,
        location: newLocation.trim() ? newLocation.trim() : null,
        agenda: newAgenda.trim() ? newAgenda.trim() : null,
      });
      if (!session) return;
      setSessions((prev) => [...prev, session]);
      setNewStartsAt("");
      setNewLocation("");
      setNewAgenda("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    }
  };

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Schedule
            </h1>
            <p className="text-sm text-muted-foreground">Sessions and reminders per case (mediator-only).</p>
          </div>
          {selectedCaseId !== "all" && (
            <Button asChild variant="outline">
              <Link to={`/admin/cases/${selectedCaseId}`}>Open case</Link>
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={selectedCaseId}
              onChange={(e) => {
                const next = e.target.value;
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.set("case", next);
                  return p;
                });
              }}
              className="px-3 py-2 rounded-md border bg-background text-sm"
              disabled={loading}
            >
              <option value="all">All cases</option>
              {assignedPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground self-center md:text-right">
              {selectedCaseId === "all" ? "Showing all cases" : `Case: ${planTitleById[selectedCaseId] || selectedCaseId}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="datetime-local"
                value={newStartsAt}
                onChange={(e) => setNewStartsAt(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              />
              <select
                value={newMode}
                onChange={(e) => setNewMode(e.target.value as api.MediatorSessionMode)}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="online">Online</option>
                <option value="in_person">In person</option>
                <option value="phone">Phone</option>
                <option value="other">Other</option>
              </select>
              <input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Location / link (optional)"
                className="px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
            <input
              value={newAgenda}
              onChange={(e) => setNewAgenda(e.target.value)}
              placeholder="Agenda (optional)"
              className="px-3 py-2 rounded-md border bg-background text-sm w-full"
            />
            <Button onClick={createSession} className="gap-2">
              <Plus className="w-4 h-4" />
              Add session
            </Button>
            <p className="text-xs text-muted-foreground">
              For safety, sessions are mediator-only records (no notifications yet).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading sessions…</p>
            ) : upcomingSessions.length ? (
              upcomingSessions.map((s) => (
                <div key={s.id} className="p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {planTitleById[s.plan_id] || s.plan_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(s.starts_at)}
                      {s.ends_at ? ` – ${formatDateTime(s.ends_at)}` : ""}
                      {" • "}
                      {s.mode.replaceAll("_", " ")}
                      {s.location ? ` • ${s.location}` : ""}
                    </p>
                    {s.agenda && <p className="text-xs text-muted-foreground truncate">Agenda: {s.agenda}</p>}
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/cases/${s.plan_id}`}>Open case</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default MediatorSchedule;

