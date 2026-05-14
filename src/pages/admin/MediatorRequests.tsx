import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";

export default function MediatorRequests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<api.MediationRequestWithContext[]>([]);
  const [actingId, setActingId] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await api.getPendingMediationRequests({ limit: 100 });
      setRequests(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Requests</h1>
            <p className="text-sm text-muted-foreground">New requests from parents to be assigned a mediator.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/plans">Cases</Link>
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : requests.length ? (
              requests.map((r) => (
                <div key={r.id} className="p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.plan_title || "Case"}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested by: {r.requester_name || r.requester_email || r.requester_user_id}
                      {" • "}
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                    {r.notes ? <p className="text-sm mt-2 whitespace-pre-wrap">{r.notes}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link to={`/admin/cases/${r.plan_id}`}>Open</Link>
                    </Button>
                    <Button
                      size="sm"
                      disabled={actingId === r.id}
                      onClick={async () => {
                        try {
                          setActingId(r.id);
                          await api.acceptMediationRequest(r.id);
                          setRequests((prev) => prev.filter((x) => x.id !== r.id));
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed to accept");
                        } finally {
                          setActingId("");
                        }
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actingId === r.id}
                      onClick={async () => {
                        if (!confirm("Reject this request?")) return;
                        try {
                          setActingId(r.id);
                          await api.rejectMediationRequest(r.id);
                          setRequests((prev) => prev.filter((x) => x.id !== r.id));
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed to reject");
                        } finally {
                          setActingId("");
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
}

