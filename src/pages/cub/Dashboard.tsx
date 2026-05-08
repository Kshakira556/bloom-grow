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
  const [accountMetrics, setAccountMetrics] = useState<api.CubAccountMetrics | null>(null);
  const [usage, setUsage] = useState<api.CubStorageUsage | null>(null);
  const [logs, setLogs] = useState<api.AuditLog[]>([]);
  const [deletions, setDeletions] = useState<api.AccountDeletionRequest[]>([]);
  const [privacyRequests, setPrivacyRequests] = useState<api.PrivacyRequest[]>([]);
  const [pendingPlanDestructions, setPendingPlanDestructions] = useState<number>(0);
  const [decisions, setDecisions] = useState<api.CubDecisionLogEntry[]>([]);
  const [decisionCategory, setDecisionCategory] = useState("security");
  const [decisionTitle, setDecisionTitle] = useState("");
  const [decisionDetails, setDecisionDetails] = useState("");
  const [savingDecision, setSavingDecision] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [legalHoldTarget, setLegalHoldTarget] = useState<"plan" | "user">("plan");
  const [legalHoldId, setLegalHoldId] = useState("");
  const [legalHoldEnabled, setLegalHoldEnabled] = useState(true);
  const [legalHoldReason, setLegalHoldReason] = useState("");
  const [privacyStatusFilter, setPrivacyStatusFilter] = useState<api.PrivacyRequestStatus | "all">("all");
  const [showOnlyOverduePrivacy, setShowOnlyOverduePrivacy] = useState(false);
  const [slaAcknowledgeBusinessDays, setSlaAcknowledgeBusinessDays] = useState(5);
  const [slaOutcomeBusinessDays, setSlaOutcomeBusinessDays] = useState(20);
  const [incidents, setIncidents] = useState<api.CubIncident[]>([]);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState<api.CubIncidentSeverity>("medium");
  const [incidentOwner, setIncidentOwner] = useState("");
  const [incidentNotes, setIncidentNotes] = useState("");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportingAudit, setExportingAudit] = useState(false);
  const [exportingIncidents, setExportingIncidents] = useState(false);
  const [exportingPrivacyRequests, setExportingPrivacyRequests] = useState(false);
  const [auditPackChecks, setAuditPackChecks] = useState<Record<string, boolean>>({
    "policies_links": true,
    "info_officer_contact": true,
    "consent_capture": true,
    "ropa_present": true,
    "dsar_exports": true,
    "privacy_requests_workflow": true,
    "retention_deletion_jobs": true,
    "security_safeguards": true,
    "incident_runbook": true,
    "operator_controls": false,
    "secret_rotation_log": false,
    "evidence_storage_defined": false,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, accounts, u, l, d, pendingDestructions, decisionRows] = await Promise.all([
        api.getCubUserMetrics(),
        api.getCubAccountMetrics(),
        api.getCubStorageUsage(),
        api.getCubAuditLogs(),
        api.getCubDeletionRequests(),
        api.getCubPendingPlanDestructions(),
        api.listCubDecisionLog({ limit: 50 }),
      ]);
      setMetrics(m);
      setAccountMetrics(accounts);
      setUsage(u);
      setLogs(l);
      setDeletions(d);
      setPendingPlanDestructions(pendingDestructions);
      setDecisions(decisionRows);

      try {
        const reqs = await api.getCubPrivacyRequests({ limit: 200 });
        setPrivacyRequests(reqs);
      } catch {
        setPrivacyRequests([]);
      }

      try {
        const list = await api.getCubIncidents({ limit: 100 });
        setIncidents(list);
      } catch {
        setIncidents([]);
      }
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

  const businessDaysBetween = (start: Date, end: Date): number => {
    // Counts business days from start (exclusive) to end (inclusive-ish) in local time, skipping Sat/Sun.
    // Good enough for internal SLA monitoring; adjust later if you want public-holiday awareness.
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
    if (e <= s) return 0;

    // Normalize to midnight local
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    let days = 0;
    const cur = new Date(s);
    while (cur < e) {
      cur.setDate(cur.getDate() + 1);
      const dow = cur.getDay(); // 0 Sun, 6 Sat
      if (dow !== 0 && dow !== 6) days += 1;
    }
    return days;
  };

  const computePrivacyOverdue = (r: api.PrivacyRequest): { overdue: boolean; ageBusinessDays: number } => {
    const createdAt = new Date(r.created_at);
    const now = new Date();
    const ageBusinessDays = businessDaysBetween(createdAt, now);

    if (r.status === "pending") {
      return { overdue: ageBusinessDays > slaAcknowledgeBusinessDays, ageBusinessDays };
    }

    if (r.status === "acknowledged") {
      return { overdue: ageBusinessDays > slaOutcomeBusinessDays, ageBusinessDays };
    }

    return { overdue: false, ageBusinessDays };
  };

  const privacyOverdueCount = useMemo(() => {
    return privacyRequests.reduce((acc, r) => {
      const meta = computePrivacyOverdue(r);
      return acc + (meta.overdue ? 1 : 0);
    }, 0);
  }, [privacyRequests, slaAcknowledgeBusinessDays, slaOutcomeBusinessDays]);

  const privacyEmailFailuresCount = useMemo(() => {
    const actions = new Set(["privacy_request_email_failed", "privacy_status_email_failed"]);
    return logs.filter((l) => actions.has(l.action)).length;
  }, [logs]);

  const pendingDeletionRequestsCount = useMemo(() => {
    return deletions.filter((d) => d.status === "pending").length;
  }, [deletions]);

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
            <Button variant="outline" onClick={() => (window.location.href = "/cub/users")}>
              Manage users
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
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    <CardTitle>Parent Users</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {metrics?.totals.parents ?? 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Mediators</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {metrics?.totals.mediators ?? 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Admins</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {metrics?.totals.admins ?? 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>CUB Internal</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {metrics?.totals.cub_internal ?? 0}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Accounts (Plans)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="font-bold text-lg">{accountMetrics?.accounts_total ?? 0}</div>
                    <div className="text-muted-foreground">
                      Active {accountMetrics?.by_status.active ?? 0} · Draft {accountMetrics?.by_status.draft ?? 0} · Archived {accountMetrics?.by_status.archived ?? 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Accounts (2 Parents)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {accountMetrics?.plans_with_2_parents ?? 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Accounts (1 Parent)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {accountMetrics?.plans_with_1_parent ?? 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Accounts (0 Parents)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {accountMetrics?.plans_with_0_parents ?? 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Accounts (Pending Invites)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {accountMetrics?.plans_with_pending_invites ?? 0}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Operational Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Overdue privacy requests</span>
                    <span className="font-medium">{privacyOverdueCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Privacy email failures (audit)</span>
                    <span className="font-medium">{privacyEmailFailuresCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending deletion requests</span>
                    <span className="font-medium">{pendingDeletionRequestsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending plan redactions (due)</span>
                    <span className="font-medium">{pendingPlanDestructions}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export (Audit/Incidents)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Export logs with timestamps and IDs for audits/incidents. After major actions (key rotations, policy changes),
                    record a short entry in <span className="font-medium text-foreground">docs/compliance/DECISIONS_LOG.md</span>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">From (optional)</label>
                      <Input
                        type="date"
                        value={exportFrom}
                        onChange={(e) => setExportFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">To (optional)</label>
                      <Input
                        type="date"
                        value={exportTo}
                        onChange={(e) => setExportTo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={exportingAudit}
                      onClick={async () => {
                        setExportingAudit(true);
                        try {
                          const from = exportFrom ? new Date(`${exportFrom}T00:00:00.000Z`).toISOString() : undefined;
                          const to = exportTo ? new Date(`${exportTo}T23:59:59.999Z`).toISOString() : undefined;
                          const rows = await api.getCubAuditLogs({ from, to, limit: 5000 });
                          const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `cub-audit-logs-${exportFrom || "all"}_${exportTo || "all"}.json`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed to export audit logs");
                        } finally {
                          setExportingAudit(false);
                        }
                      }}
                    >
                      {exportingAudit ? "Exporting..." : "Export audit logs (JSON)"}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={exportingIncidents}
                      onClick={async () => {
                        setExportingIncidents(true);
                        try {
                          const from = exportFrom ? new Date(`${exportFrom}T00:00:00.000Z`).toISOString() : undefined;
                          const to = exportTo ? new Date(`${exportTo}T23:59:59.999Z`).toISOString() : undefined;
                          const rows = await api.getCubIncidents({ from, to, limit: 500 });
                          const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `cub-incidents-${exportFrom || "all"}_${exportTo || "all"}.json`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed to export incidents");
                        } finally {
                          setExportingIncidents(false);
                        }
                      }}
                    >
                      {exportingIncidents ? "Exporting..." : "Export incidents (JSON)"}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={exportingPrivacyRequests}
                      onClick={async () => {
                        setExportingPrivacyRequests(true);
                        try {
                          const from = exportFrom ? new Date(`${exportFrom}T00:00:00.000Z`).toISOString() : undefined;
                          const to = exportTo ? new Date(`${exportTo}T23:59:59.999Z`).toISOString() : undefined;
                          const rows = await api.getCubPrivacyRequests({ from, to, limit: 2000 });
                          const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `cub-privacy-requests-${exportFrom || "all"}_${exportTo || "all"}.json`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed to export privacy requests");
                        } finally {
                          setExportingPrivacyRequests(false);
                        }
                      }}
                    >
                      {exportingPrivacyRequests ? "Exporting..." : "Export privacy requests (JSON)"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Decisions Log</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Record major actions (key rotations, policy changes, access changes) in a structured log for audits.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs text-muted-foreground">Category</label>
                      <select
                        value={decisionCategory}
                        onChange={(e) => setDecisionCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
                      >
                        <option value="security">Security</option>
                        <option value="policy">Policy</option>
                        <option value="operator">Operator/Vendor</option>
                        <option value="access">Access control</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Title</label>
                      <Input
                        value={decisionTitle}
                        onChange={(e) => setDecisionTitle(e.target.value)}
                        placeholder="Short summary (e.g., Rotated JWT_SECRET)"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Details (optional)</label>
                    <textarea
                      value={decisionDetails}
                      onChange={(e) => setDecisionDetails(e.target.value)}
                      className="w-full min-h-[92px] px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
                      placeholder="What changed, why, and any verification notes (optional)"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={savingDecision || !decisionCategory.trim() || !decisionTitle.trim()}
                      onClick={async () => {
                        setSavingDecision(true);
                        try {
                          await api.createCubDecisionLog({
                            category: decisionCategory.trim(),
                            title: decisionTitle.trim(),
                            details: decisionDetails.trim() || undefined,
                          });
                          setDecisionTitle("");
                          setDecisionDetails("");
                          const rows = await api.listCubDecisionLog({ limit: 50 });
                          setDecisions(rows);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed to save decision entry");
                        } finally {
                          setSavingDecision(false);
                        }
                      }}
                    >
                      {savingDecision ? "Saving..." : "Add entry"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const rows = await api.listCubDecisionLog({ limit: 50 });
                          setDecisions(rows);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Refresh
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {decisions.length === 0 ? (
                      <div className="text-muted-foreground">No entries yet.</div>
                    ) : (
                      decisions.slice(0, 10).map((d) => (
                        <div key={d.id} className="p-3 border rounded-lg bg-secondary/10">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{d.category}</span>
                            <span>{new Date(d.created_at).toLocaleString()}</span>
                            <span className="truncate">ID: {d.id}</span>
                          </div>
                          <div className="text-sm font-medium mt-1">{d.title}</div>
                          {d.details && <div className="text-sm whitespace-pre-wrap mt-1">{d.details}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Decisions Log</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Record major actions (key rotations, policy changes, access changes) in a structured log for audits.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs text-muted-foreground">Category</label>
                      <select
                        value={decisionCategory}
                        onChange={(e) => setDecisionCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
                      >
                        <option value="security">Security</option>
                        <option value="policy">Policy</option>
                        <option value="operator">Operator/Vendor</option>
                        <option value="access">Access control</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Title</label>
                      <Input
                        value={decisionTitle}
                        onChange={(e) => setDecisionTitle(e.target.value)}
                        placeholder="Short summary (e.g., Rotated JWT_SECRET)"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Details (optional)</label>
                    <textarea
                      value={decisionDetails}
                      onChange={(e) => setDecisionDetails(e.target.value)}
                      className="w-full min-h-[92px] px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
                      placeholder="What changed, why, and any verification notes (optional)"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={savingDecision || !decisionCategory.trim() || !decisionTitle.trim()}
                      onClick={async () => {
                        setSavingDecision(true);
                        try {
                          await api.createCubDecisionLog({
                            category: decisionCategory.trim(),
                            title: decisionTitle.trim(),
                            details: decisionDetails.trim() || undefined,
                          });
                          setDecisionTitle("");
                          setDecisionDetails("");
                          const rows = await api.listCubDecisionLog({ limit: 50 });
                          setDecisions(rows);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed to save decision entry");
                        } finally {
                          setSavingDecision(false);
                        }
                      }}
                    >
                      {savingDecision ? "Saving..." : "Add entry"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const rows = await api.listCubDecisionLog({ limit: 50 });
                          setDecisions(rows);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Refresh
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {decisions.length === 0 ? (
                      <div className="text-muted-foreground">No entries yet.</div>
                    ) : (
                      decisions.slice(0, 10).map((d) => (
                        <div key={d.id} className="p-3 border rounded-lg bg-secondary/10">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{d.category}</span>
                            <span>{new Date(d.created_at).toLocaleString()}</span>
                            <span className="truncate">ID: {d.id}</span>
                          </div>
                          <div className="text-sm font-medium mt-1">{d.title}</div>
                          {d.details && <div className="text-sm whitespace-pre-wrap mt-1">{d.details}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit Pack Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Quick internal checklist for POPIA audit readiness. This list is local-only (not stored).
                    Source reference: <span className="font-medium text-foreground">docs/compliance/AUDIT_PACK_CHECKLIST.md</span>.
                  </p>
                  <div className="grid gap-2">
                    {[
                      { k: "policies_links", label: "Privacy/Terms/Privacy Requests visible + linked" },
                      { k: "info_officer_contact", label: "Information Officer contact shown + incident inbox set" },
                      { k: "consent_capture", label: "Terms/Privacy acceptance captured (DB fields + UI)" },
                      { k: "ropa_present", label: "RoPA present and updated (docs/compliance/ROPA.md)" },
                      { k: "dsar_exports", label: "DSAR exports available (JSON + ZIP)" },
                      { k: "privacy_requests_workflow", label: "Privacy requests workflow + statuses + emails working" },
                      { k: "retention_deletion_jobs", label: "Deletion/anonymisation + plan redaction jobs running (cron)" },
                      { k: "security_safeguards", label: "Rate limits + audit logging for sensitive actions" },
                      { k: "incident_runbook", label: "Incident response runbook + incidents tracker" },
                      { k: "operator_controls", label: "Operator access + least privilege documented" },
                      { k: "secret_rotation_log", label: "Secret rotation log maintained" },
                      { k: "evidence_storage_defined", label: "Evidence storage location defined" },
                    ].map((item) => (
                      <label key={item.k} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(auditPackChecks[item.k])}
                          onChange={(e) =>
                            setAuditPackChecks((prev) => ({ ...prev, [item.k]: e.target.checked }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Incidents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Capture suspected privacy/security incidents here. Placeholders: incident inbox and backups can be finalised later.
                  </p>
                  <p className="text-muted-foreground">
                    Incident inbox: <span className="font-medium text-foreground">incidents@cubapp.co.za</span> • Backups:{" "}
                    <span className="font-medium text-foreground">nicole@cubapp.co.za</span>,{" "}
                    <span className="font-medium text-foreground">shakira@cubapp.co.za</span>
                  </p>
                  <p className="text-muted-foreground">
                    Runbook (repo): <span className="font-medium text-foreground">docs/compliance/INCIDENT_RESPONSE.md</span>
                  </p>
                  <div className="grid gap-2">
                    <Input
                      value={incidentTitle}
                      onChange={(e) => setIncidentTitle(e.target.value)}
                      placeholder="Incident title (e.g., Suspicious access)"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={incidentSeverity}
                        onChange={(e) => setIncidentSeverity(e.target.value as api.CubIncidentSeverity)}
                        className="px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <Input
                        value={incidentOwner}
                        onChange={(e) => setIncidentOwner(e.target.value)}
                        placeholder="Owner (placeholder)"
                      />
                    </div>
                    <Input
                      value={incidentNotes}
                      onChange={(e) => setIncidentNotes(e.target.value)}
                      placeholder="Notes (placeholder)"
                    />
                    <Button
                      disabled={processing || !incidentTitle.trim()}
                      onClick={async () => {
                        setProcessing(true);
                        try {
                          await api.createCubIncident({
                            title: incidentTitle.trim(),
                            severity: incidentSeverity,
                            owner: incidentOwner.trim() || undefined,
                            notes: incidentNotes.trim() || undefined,
                          });
                          setIncidentTitle("");
                          setIncidentOwner("");
                          setIncidentNotes("");
                          await load();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed to create incident");
                        } finally {
                          setProcessing(false);
                        }
                      }}
                    >
                      Create incident
                    </Button>
                  </div>

                  {incidents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No incidents logged.</p>
                  ) : (
                    incidents.slice(0, 10).map((inc) => (
                      <div key={inc.id} className="p-3 border rounded-xl space-y-1">
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-secondary">{inc.status}</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary">{inc.severity}</span>
                          <span>{new Date(inc.opened_at).toLocaleString()}</span>
                        </div>
                        <div className="font-medium">{inc.title}</div>
                        {inc.owner && <div className="text-xs text-muted-foreground">Owner: {inc.owner}</div>}
                        {inc.notes && <div className="text-xs text-muted-foreground">{inc.notes}</div>}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={privacyStatusFilter}
                      onChange={(e) => setPrivacyStatusFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm px-2 py-1 rounded-lg border bg-secondary/10">
                      <input
                        type="checkbox"
                        checked={showOnlyOverduePrivacy}
                        onChange={(e) => setShowOnlyOverduePrivacy(e.target.checked)}
                      />
                      Overdue only
                    </label>
                    <Button variant="outline" onClick={load} disabled={loading}>
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">SLA: Acknowledge within (business days)</label>
                      <Input
                        type="number"
                        min={1}
                        value={slaAcknowledgeBusinessDays}
                        onChange={(e) => setSlaAcknowledgeBusinessDays(Math.max(1, Number(e.target.value) || 1))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">SLA: Outcome within (business days)</label>
                      <Input
                        type="number"
                        min={1}
                        value={slaOutcomeBusinessDays}
                        onChange={(e) => setSlaOutcomeBusinessDays(Math.max(1, Number(e.target.value) || 1))}
                      />
                    </div>
                  </div>

                  {(() => {
                    const base =
                      privacyStatusFilter === "all"
                        ? privacyRequests
                        : privacyRequests.filter((r) => r.status === privacyStatusFilter);

                    const withOverdue = base.map((r) => ({
                      r,
                      meta: computePrivacyOverdue(r),
                    }));

                    const filtered = showOnlyOverduePrivacy
                      ? withOverdue.filter((x) => x.meta.overdue)
                      : withOverdue;

                    if (filtered.length === 0) {
                      return <p className="text-sm text-muted-foreground">No privacy requests.</p>;
                    }

                    return filtered
                      .slice(0, 30)
                      .map(({ r, meta }) => (
                        <div key={r.id} className={`p-3 border rounded-xl space-y-2 ${meta.overdue ? "border-destructive/40" : ""}`}>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-secondary">{r.status}</span>
                            {meta.overdue && (
                              <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                                overdue
                              </span>
                            )}
                            <span>Type: {r.request_type}</span>
                            {r.user_id ? <span>User: {r.user_id}</span> : <span>Unlinked</span>}
                            <span>{new Date(r.created_at).toLocaleString()}</span>
                            <span>Age: {meta.ageBusinessDays} bd</span>
                          </div>
                          {r.contact_email && (
                            <div className="text-xs text-muted-foreground">Contact: {r.contact_email}</div>
                          )}
                          {r.details && <div className="text-sm whitespace-pre-wrap">{r.details}</div>}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processing || r.status !== "pending"}
                              onClick={async () => {
                                setProcessing(true);
                                try {
                                  await api.updateCubPrivacyRequestStatus(r.id, "acknowledged");
                                  await load();
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "Failed to update request");
                                } finally {
                                  setProcessing(false);
                                }
                              }}
                            >
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processing || (r.status !== "pending" && r.status !== "acknowledged")}
                              onClick={async () => {
                                setProcessing(true);
                                try {
                                  await api.updateCubPrivacyRequestStatus(r.id, "fulfilled");
                                  await load();
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "Failed to update request");
                                } finally {
                                  setProcessing(false);
                                }
                              }}
                            >
                              Fulfill
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processing || r.status === "fulfilled" || r.status === "rejected"}
                              onClick={async () => {
                                const confirmed = window.confirm("Reject this privacy request?");
                                if (!confirmed) return;
                                setProcessing(true);
                                try {
                                  await api.updateCubPrivacyRequestStatus(r.id, "rejected");
                                  await load();
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "Failed to update request");
                                } finally {
                                  setProcessing(false);
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ));
                  })()}
                </CardContent>
              </Card>

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
                    placeholder="Search action, notes, ids..."
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
