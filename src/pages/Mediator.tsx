import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { MediationRequestCard } from "@/components/mediation/MediationRequestCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

export default function Mediator() {
  const { user } = useAuthContext();
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [mediators, setMediators] = useState<api.PlanMediator[]>([]);
  const [documents, setDocuments] = useState<api.CaseDocument[]>([]);
  const [sessions, setSessions] = useState<api.SharedMediatorSession[]>([]);
  const [decisions, setDecisions] = useState<api.PlanDecision[]>([]);
  const [latestMessage, setLatestMessage] = useState<api.ApiMessage | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [decisionsError, setDecisionsError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocName, setPreviewDocName] = useState("");
  const [previewContentType, setPreviewContentType] = useState<string | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>("");
  const [previewDownloadUrl, setPreviewDownloadUrl] = useState<string>("");
  const [previewExternalUrl, setPreviewExternalUrl] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "sessions" | "decisions">("overview");

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        setLoading(true);
        const { plans } = await api.getPlans();
        setPlans(plans ?? []);
        if (plans?.[0]?.id) {
          const { plan } = await api.getPlanById(plans[0].id);
          setActivePlan(plan);
        } else {
          setActivePlan(null);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user?.id]);

  useEffect(() => {
    const planId = activePlan?.id;
    if (!user?.id || !planId) {
      setMediators([]);
      setDocuments([]);
      setSessions([]);
      setDecisions([]);
      setLatestMessage(null);
      return;
    }

    const load = async () => {
      try {
        setDocsError(null);
        setSessionsError(null);
        setDecisionsError(null);
        const [m, d, s] = await Promise.all([
          api.getPlanMediators(planId),
          api.getSharedCaseDocuments(planId),
          api.getSharedMediatorSessions(planId),
        ]);
        setMediators(m);
        setDocuments(d);
        setSessions(s);

        try {
          const dec = await api.getPlanDecisions(planId);
          setDecisions(dec);
        } catch (e) {
          setDecisionsError(e instanceof Error ? e.message : "Failed to load decisions");
          setDecisions([]);
        }

        try {
          const res = await api.getMessagesByPlan(planId, { limit: 1 });
          setLatestMessage(res.messages?.[0] ?? null);
        } catch {
          setLatestMessage(null);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load mediator info";
        setDocsError(msg);
        setSessionsError(msg);
        setDecisionsError(msg);
      }
    };

    void load();
  }, [activePlan?.id, user?.id]);

  useEffect(() => {
    if (!previewOpen && previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl("");
    }
    if (!previewOpen && previewExternalUrl) {
      setPreviewExternalUrl("");
    }
  }, [previewOpen, previewBlobUrl, previewExternalUrl]);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-3xl mx-auto space-y-4">
          <h1 className="font-display text-3xl font-bold text-primary">Mediator</h1>
          <p className="text-sm text-muted-foreground">
            Request and manage mediator oversight for a specific parenting plan.
          </p>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No plans yet. Create a plan first.</p>
              ) : (
                <select
                  value={activePlan?.id ?? ""}
                  onChange={async (e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const { plan } = await api.getPlanById(id);
                    setActivePlan(plan);
                  }}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  disabled={loading}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Assigned mediator(s)</CardTitle>
                </CardHeader>
                <CardContent>
                  {activePlan?.id ? (
                    mediators.length ? (
                      <ul className="space-y-2">
                        {mediators.map((m) => (
                          <li key={m.user_id} className="text-sm">
                            <div className="font-medium">{m.full_name}</div>
                            {(m.city || m.province) && (
                              <div className="text-xs text-muted-foreground">
                                {[m.city, m.province].filter(Boolean).join(", ")}
                              </div>
                            )}
                            {m.bio && <div className="text-xs text-muted-foreground mt-1">{m.bio}</div>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No mediator assigned yet.</p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a plan to continue.</p>
                  )}

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setActiveTab("documents")}
                      disabled={!activePlan?.id}
                    >
                      View shared documents
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setActiveTab("sessions")}
                      disabled={!activePlan?.id}
                    >
                      View sessions
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link to="/messages">Message mediator</Link>
                    </Button>
                  </div>

                  {latestMessage && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Latest message: <span className="text-foreground">{latestMessage.content.slice(0, 140)}</span>
                      {latestMessage.content.length > 140 ? "…" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>

              {activePlan?.id && mediators.length > 0 ? (
                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Request a mediator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      A mediator is already assigned to this plan. Requesting another mediator is disabled.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <MediationRequestCard planId={activePlan?.id ?? null} disabled={loading || !user?.id} />
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Shared documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docsError && <p className="text-xs text-destructive">{docsError}</p>}
                  {!activePlan?.id ? (
                    <p className="text-sm text-muted-foreground">Select a plan to continue.</p>
                  ) : documents.length ? (
                    <div className="space-y-2">
                      {documents.map((d) => (
                        <div key={d.id} className="p-3 border rounded-xl flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" title={d.name}>
                              {d.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              v{d.version} • {new Date(d.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={previewLoading}
                              onClick={async () => {
                                if (!activePlan?.id) return;
                                try {
                                  setPreviewLoading(true);
                                  setDocsError(null);
                                  const signedUrl = await api.getSharedCaseDocumentSignedUrl(activePlan.id, d.id);
                                  setPreviewDocName(d.name);
                                  setPreviewContentType(d.content_type ?? null);
                                  setPreviewDownloadUrl(signedUrl);

                                  const contentType = (d.content_type ?? "").toLowerCase();
                                  const isPdf = contentType === "application/pdf";
                                  const isImage = contentType.startsWith("image/");
                                  const isDocx =
                                    contentType ===
                                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                                    d.name.toLowerCase().endsWith(".docx");

                                  if (isDocx) {
                                    setPreviewExternalUrl(
                                      `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signedUrl)}`,
                                    );
                                    setPreviewBlobUrl("");
                                    setPreviewOpen(true);
                                    return;
                                  }

                                  if (isPdf || isImage) {
                                    const resp = await fetch(signedUrl);
                                    const blob = await resp.blob();
                                    const url = URL.createObjectURL(blob);
                                    setPreviewBlobUrl(url);
                                    setPreviewExternalUrl("");
                                    setPreviewOpen(true);
                                    return;
                                  }

                                  // Fallback: no preview, but allow download.
                                  setPreviewBlobUrl("");
                                  setPreviewExternalUrl("");
                                  setPreviewOpen(true);
                                } catch (e) {
                                  setDocsError(e instanceof Error ? e.message : "Failed to preview document");
                                } finally {
                                  setPreviewLoading(false);
                                }
                              }}
                            >
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!activePlan?.id) return;
                                const signedUrl = await api.getSharedCaseDocumentSignedUrl(activePlan.id, d.id);
                                const opened = window.open(signedUrl, "_blank", "noopener,noreferrer");
                                if (!opened) window.location.href = signedUrl;
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No shared documents yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Shared sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sessionsError && <p className="text-xs text-destructive">{sessionsError}</p>}
                  {!activePlan?.id ? (
                    <p className="text-sm text-muted-foreground">Select a plan to continue.</p>
                  ) : sessions.length ? (
                    <div className="space-y-2">
                      {sessions.map((s) => (
                        <div key={s.id} className="p-3 border rounded-xl space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {new Date(s.starts_at).toLocaleString()}
                              {s.ends_at ? ` – ${new Date(s.ends_at).toLocaleString()}` : ""}
                            </p>
                            <span className="text-xs text-muted-foreground">{s.mode}</span>
                          </div>
                          {s.location && <p className="text-xs text-muted-foreground">Location: {s.location}</p>}
                          {s.agenda && <p className="text-sm">{s.agenda}</p>}
                          <div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loading}
                              onClick={async () => {
                                if (!activePlan?.id) return;
                                try {
                                  const items = await api.getSharedSessionActionItems(activePlan.id, s.id);
                                  alert(
                                    items.length
                                      ? items.map((i) => `- ${i.text}${i.due_at ? ` (due ${new Date(i.due_at).toLocaleDateString()})` : ""}`).join("\n")
                                      : "No shared action items.",
                                  );
                                } catch (e) {
                                  setSessionsError(e instanceof Error ? e.message : "Failed to load action items");
                                }
                              }}
                            >
                              View action items
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No shared sessions yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions" className="space-y-4">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Decisions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {decisionsError && <p className="text-xs text-destructive">{decisionsError}</p>}
                  {!activePlan?.id ? (
                    <p className="text-sm text-muted-foreground">Select a plan to continue.</p>
                  ) : decisions.length ? (
                    <div className="space-y-2">
                      {decisions.map((d) => (
                        <div key={d.id} className="p-3 border rounded-xl space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate" title={d.title}>
                              {d.title}
                            </p>
                            <span className="text-xs text-muted-foreground">{d.status}</span>
                          </div>
                          {d.reviewer_name && (
                            <p className="text-xs text-muted-foreground">
                              Reviewed by {d.reviewer_name}
                              {d.reviewed_at ? ` • ${new Date(d.reviewed_at).toLocaleString()}` : ""}
                            </p>
                          )}
                          {d.reviewed_notes && <p className="text-sm">{d.reviewed_notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No decisions yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="truncate" title={previewDocName}>
              {previewDocName || "Document"}
            </DialogTitle>
            <DialogDescription>Preview (download available)</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!previewDownloadUrl}
              onClick={() => {
                if (!previewDownloadUrl) return;
                const opened = window.open(previewDownloadUrl, "_blank", "noopener,noreferrer");
                if (!opened) window.location.href = previewDownloadUrl;
              }}
            >
              Download
            </Button>
          </div>

          <div className="border rounded-lg bg-muted/20 overflow-hidden h-[70vh]">
            {previewLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading preview…</div>
            ) : previewExternalUrl ? (
              <iframe title={previewDocName || "Document"} src={previewExternalUrl} className="w-full h-full" />
            ) : previewBlobUrl ? (
              previewContentType?.startsWith("image/") ? (
                <div className="h-full overflow-auto p-4 flex justify-center">
                  <img src={previewBlobUrl} alt={previewDocName || "Document"} className="max-w-full h-auto" />
                </div>
              ) : previewContentType === "application/pdf" ? (
                <iframe title={previewDocName || "Document"} src={previewBlobUrl} className="w-full h-full" />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground px-6 text-center">
                  Preview isn’t available for this file type. Use Download.
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No preview.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
