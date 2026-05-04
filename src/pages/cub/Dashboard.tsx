import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as api from "@/lib/api";

const bytesToHuman = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  return `${value.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
};

export default function CubDashboard() {
  const [metrics, setMetrics] = useState<api.CubUserMetrics | null>(null);
  const [usage, setUsage] = useState<api.CubStorageUsage | null>(null);
  const [logs, setLogs] = useState<api.AuditLog[]>([]);
  const [deletions, setDeletions] = useState<api.AccountDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [legalHoldTarget, setLegalHoldTarget] = useState<"plan" | "user">("plan");
  const [legalHoldId, setLegalHoldId] = useState("");
  const [legalHoldEnabled, setLegalHoldEnabled] = useState(true);
  const [legalHoldReason, setLegalHoldReason] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, u, l, d] = await Promise.all([
        api.getCubUserMetrics(),
        api.getCubStorageUsage(),
        api.getCubAuditLogs(),
        api.getCubDeletionRequests(),
      ]);
      setMetrics(m);
      setUsage(u);
      setLogs(l);
      setDeletions(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CUB internal dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => {
      const fields = [
        log.action,
        log.target_type || "",
        log.target_id || "",
        log.notes || "",
        log.actor_id,
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [logs, logSearch]);

  const handleProcessDeletions = async () => {
    const confirmed = window.confirm(
      "Process due deletions now?\n\nThis will anonymise any users whose scheduled deletion date has passed."
    );
    if (!confirmed) return;

    setProcessing(true);
    try {
      await api.processCubDeletions({ limit: 50 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process deletions");
    } finally {
      setProcessing(false);
    }
  };

  const handleSetLegalHold = async () => {
    const id = legalHoldId.trim();
    if (!id) return;

    setProcessing(true);
    try {
      if (legalHoldTarget === "plan") {
        await api.setCubPlanLegalHold(id, { legal_hold: legalHoldEnabled, reason: legalHoldReason.trim() || undefined });
      } else {
        await api.setCubUserLegalHold(id, { legal_hold: legalHoldEnabled, reason: legalHoldReason.trim() || undefined });
      }
      setLegalHoldId("");
      setLegalHoldReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update legal hold");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">CUB Internal</h1>
            <p className="text-muted-foreground mt-1">Operational dashboard (CUB staff only).</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button onClick={handleProcessDeletions} disabled={processing}>
              {processing ? "Processing..." : "Process due deletions"}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {metrics?.totals.users ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Paid</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {metrics?.subscriptions.paid ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Trial</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {metrics?.subscriptions.trial ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Vault Storage</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="font-bold text-lg">{bytesToHuman(usage?.total_bytes ?? 0)}</div>
                  <div className="text-muted-foreground">{usage?.total_files ?? 0} files</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Legal Hold</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Legal hold pauses automated anonymisation/redaction for a specific user or plan.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={legalHoldTarget}
                      onChange={(e) => setLegalHoldTarget(e.target.value as "plan" | "user")}
                      className="px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
                    >
                      <option value="plan">Plan</option>
                      <option value="user">User</option>
                    </select>
                    <Input
                      value={legalHoldId}
                      onChange={(e) => setLegalHoldId(e.target.value)}
                      placeholder={legalHoldTarget === "plan" ? "Plan ID" : "User ID"}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={legalHoldEnabled ? "on" : "off"}
                      onChange={(e) => setLegalHoldEnabled(e.target.value === "on")}
                      className="px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
                    >
                      <option value="on">Enable hold</option>
                      <option value="off">Disable hold</option>
                    </select>
                    <Input
                      value={legalHoldReason}
                      onChange={(e) => setLegalHoldReason(e.target.value)}
                      placeholder="Reason (optional)"
                    />
                    <Button onClick={handleSetLegalHold} disabled={processing || !legalHoldId.trim()}>
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Deletion Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deletions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No deletion requests.</p>
                  ) : (
                    deletions.slice(0, 20).map((r) => (
                      <div key={r.id} className="p-3 border rounded-xl">
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-secondary">{r.status}</span>
                          <span>User: {r.user_id}</span>
                          <span>Scheduled: {new Date(r.scheduled_for).toLocaleString()}</span>
                        </div>
                        {r.reason && <div className="text-xs text-muted-foreground mt-1">{r.reason}</div>}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search action, notes, ids…"
                  />
                  {filteredLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No logs.</p>
                  ) : (
                    filteredLogs.slice(0, 50).map((log) => (
                      <div key={log.id} className="p-3 border rounded-xl">
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary">{log.action}</span>
                          {log.target_type && <span>{log.target_type}</span>}
                          {log.target_id && <span className="font-mono text-[10px]">{log.target_id}</span>}
                        </div>
                        {log.notes && <div className="text-xs text-muted-foreground mt-1">{log.notes}</div>}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
