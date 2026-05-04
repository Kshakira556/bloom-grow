import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as api from "@/lib/api";
import { buildUserNameMap } from "@/lib/adminData";

const toDateTime = (value: string) => new Date(value).toLocaleString();

export default function Deletions() {
  const [requests, setRequests] = useState<api.AccountDeletionRequest[]>([]);
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reqRes, usersRes] = await Promise.all([
        api.getAccountDeletionRequests(),
        api.getUsers(),
      ]);
      setRequests(reqRes);
      setUsers(usersRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deletion requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const name = (userMap[r.user_id] || r.user_id).toLowerCase();
      const reason = (r.reason || "").toLowerCase();
      return name.includes(q) || reason.includes(q) || r.status.toLowerCase().includes(q);
    });
  }, [requests, search, userMap]);

  const handleProcess = async () => {
    const confirmed = window.confirm(
      "Process due deletions now?\n\nThis will anonymise any accounts whose scheduled deletion date has passed."
    );
    if (!confirmed) return;

    setProcessing(true);
    try {
      await api.processAccountDeletions({ limit: 50 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process deletions");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Deletion Requests</h2>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Requests</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button size="sm" onClick={handleProcess} disabled={processing}>
              {processing ? "Processing..." : "Process due deletions"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Input
            placeholder="Search by user, status, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading deletion requests...</p>
          ) : filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((r) => (
                <div key={r.id} className="p-3 border rounded-xl flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                    <span className="font-medium">{userMap[r.user_id] || r.user_id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary">{r.status}</span>
                    <span>Requested: {toDateTime(r.requested_at)}</span>
                    <span>Scheduled: {toDateTime(r.scheduled_for)}</span>
                    {r.processed_at && <span>Processed: {toDateTime(r.processed_at)}</span>}
                  </div>
                  {r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No deletion requests.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

