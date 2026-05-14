import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as api from "@/lib/api";

const stageLabel = (stage?: api.MediatorCaseStage) => {
  switch (stage) {
    case "intake":
      return "Intake";
    case "screening":
      return "Screening";
    case "onboarding":
      return "Onboarding";
    case "info_gathering":
      return "Info Gathering";
    case "active_mediation":
      return "Active Mediation";
    case "drafting":
      return "Drafting";
    case "finalisation":
      return "Finalisation";
    case "follow_up":
      return "Follow-up";
    case "closed":
      return "Closed";
    default:
      return "Active Mediation";
  }
};

const MediatorCase = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [casePlan, setCasePlan] = useState<api.ModeratorAssignedPlanWithClients | null>(null);
  const [pendingProposals, setPendingProposals] = useState<api.Proposal[]>([]);
  const [messages, setMessages] = useState<api.ApiMessage[]>([]);
  const [stage, setStage] = useState<api.MediatorCaseStage>("active_mediation");
  const [decisionNotesByProposalId, setDecisionNotesByProposalId] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<api.MediatorSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [actionItems, setActionItems] = useState<api.MediatorSessionActionItem[]>([]);
  const [newActionText, setNewActionText] = useState("");
  const [sessionOutcomeNotes, setSessionOutcomeNotes] = useState("");
  const [documents, setDocuments] = useState<api.CaseDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadVisibility, setUploadVisibility] = useState<api.CaseDocumentVisibility>("shared");
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [openingDocId, setOpeningDocId] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocName, setPreviewDocName] = useState("");
  const [previewContentType, setPreviewContentType] = useState<string | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>("");
  const [previewDownloadUrl, setPreviewDownloadUrl] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const [assignedPlans, proposals] = await Promise.all([
          api.getMyModeratorAssignedPlansWithClients(),
          api.getProposals("pending").catch(() => [] as api.Proposal[]),
        ]);

        const plan = assignedPlans.find((p) => p.id === id) ?? null;
        setCasePlan(plan);
        setStage((plan?.stage ?? "active_mediation") as api.MediatorCaseStage);
        setPendingProposals(proposals.filter((p) => p.plan_id === id));

        // Messages are plan-scoped and should be permitted for assigned mediators.
        const res = await api.getMessagesByPlan(id, { includeDeleted: true, limit: 50 });
        setMessages(res.messages ?? []);

        const sessionsRes = await api.getMyMediatorSessions({ plan_id: id, limit: 200 }).catch(() => [] as api.MediatorSession[]);
        setSessions(sessionsRes);
        const firstSessionId = sessionsRes[0]?.id ?? "";
        setSelectedSessionId(firstSessionId);
        setSessionOutcomeNotes(sessionsRes[0]?.outcome_notes ?? "");

        // Documents are case-scoped. If the backend endpoint isn't available yet, keep the UI usable.
        try {
          setDocsLoading(true);
          setDocsError(null);
          const docs = await api.getCaseDocuments(id);
          setDocuments(docs.filter((d) => !d.is_deleted));
        } catch (e) {
          setDocsError(e instanceof Error ? e.message : "Failed to load documents");
        } finally {
          setDocsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load case");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const headerTitle = casePlan?.title || "Case";

  const sortedMessages = useMemo(() => {
    return messages
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [messages]);

  useEffect(() => {
    const loadItems = async () => {
      if (!selectedSessionId) {
        setActionItems([]);
        return;
      }
      const items = await api.getMySessionActionItems(selectedSessionId).catch(() => [] as api.MediatorSessionActionItem[]);
      setActionItems(items);
      const s = sessions.find((x) => x.id === selectedSessionId);
      setSessionOutcomeNotes(s?.outcome_notes ?? "");
    };
    loadItems();
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    if (!previewOpen && previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl("");
    }
  }, [previewOpen, previewBlobUrl]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{headerTitle}</h1>
            {id && <p className="text-xs text-muted-foreground">Case ID: {id}</p>}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/plans">Back to cases</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/proposals">Pending</Link>
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : casePlan?.clients?.length ? (
                casePlan.clients.map((c) => (
                  <div key={c.id} className="p-2 border rounded-lg">
                    <p className="font-medium">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No clients available for this case.</p>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    Sessions: <span className="text-foreground font-medium">{sessions.length}</span>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/schedule?case=${id}`}>Open schedule</Link>
                  </Button>
                </div>

                {sessions.length ? (
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-background text-sm w-full"
                    disabled={loading}
                  >
                    {sessions
                      .slice()
                      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {new Date(s.starts_at).toLocaleString()} ({s.mode.replaceAll("_", " ")})
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
                )}

                {selectedSessionId && (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Outcome notes (mediator-only)</p>
                      <textarea
                        value={sessionOutcomeNotes}
                        onChange={(e) => setSessionOutcomeNotes(e.target.value)}
                        className="w-full min-h-24 px-3 py-2 rounded-md border bg-background text-sm"
                        placeholder="Session outcomes, agreements reached, next steps…"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const updated = await api.updateMyMediatorSession(selectedSessionId, { outcome_notes: sessionOutcomeNotes });
                          if (!updated) return;
                          setSessions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                        }}
                      >
                        Save notes
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Action items (mediator-only)</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={newActionText}
                          onChange={(e) => setNewActionText(e.target.value)}
                          placeholder="Add an action item…"
                          className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const text = newActionText.trim();
                            if (!text) return;
                            const item = await api.createMySessionActionItem(selectedSessionId, { text, visibility: "mediator_only" });
                            if (!item) return;
                            setActionItems((prev) => [...prev, item]);
                            setNewActionText("");
                          }}
                        >
                          Add
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {actionItems.length ? (
                          actionItems.map((it) => (
                            <label key={it.id} className="flex items-start gap-3 p-3 border rounded-xl">
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={it.is_done}
                                onChange={async (e) => {
                                  const next = e.target.checked;
                                  setActionItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, is_done: next } : x)));
                                  try {
                                    const updated = await api.updateMySessionActionItem(it.id, { is_done: next });
                                    if (updated) setActionItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                                  } catch {
                                    setActionItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, is_done: it.is_done } : x)));
                                  }
                                }}
                              />
                              <div className="min-w-0">
                                <p className="text-sm">{it.text}</p>
                                <p className="text-xs text-muted-foreground">Visibility: {it.visibility.replaceAll("_", " ")}</p>
                              </div>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No action items yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stage</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">Current: <span className="text-foreground font-medium">{stageLabel(stage)}</span></div>
                <div className="flex gap-2">
                  <select
                    value={stage}
                    onChange={async (e) => {
                      const next = e.target.value as api.MediatorCaseStage;
                      setStage(next);
                      if (!id) return;
                      try {
                        await api.setMyMediatorCaseStage(id, next);
                      } catch {
                        // revert on failure
                        setStage((casePlan?.stage ?? "active_mediation") as api.MediatorCaseStage);
                      }
                    }}
                    className="px-3 py-2 rounded-md border bg-background text-sm"
                    disabled={loading || !id}
                  >
                    <option value="intake">Intake</option>
                    <option value="screening">Screening</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="info_gathering">Info Gathering</option>
                    <option value="active_mediation">Active Mediation</option>
                    <option value="drafting">Drafting</option>
                    <option value="finalisation">Finalisation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : pendingProposals.length ? (
                  pendingProposals.map((p) => (
                    <div key={p.id} className="p-3 border rounded-xl space-y-2">
                      <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>

                      <input
                        value={decisionNotesByProposalId[p.id] ?? ""}
                        onChange={(e) =>
                          setDecisionNotesByProposalId((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        placeholder="Reason / notes (optional)"
                        className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                      />

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!p.id) return;
                            const notes = decisionNotesByProposalId[p.id]?.trim() || undefined;
                            const updated = await api.updateProposalStatus(p.id, { status: "approved", notes });
                            if (!updated) return;
                            setPendingProposals((prev) => prev.filter((x) => x.id !== p.id));
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (!p.id) return;
                            const notes = decisionNotesByProposalId[p.id]?.trim() || undefined;
                            const updated = await api.updateProposalStatus(p.id, { status: "changes_requested", notes });
                            if (!updated) return;
                            setPendingProposals((prev) => prev.filter((x) => x.id !== p.id));
                          }}
                        >
                          Request edits
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!p.id) return;
                            const notes = decisionNotesByProposalId[p.id]?.trim() || undefined;
                            const updated = await api.updateProposalStatus(p.id, { status: "rejected", notes });
                            if (!updated) return;
                            setPendingProposals((prev) => prev.filter((x) => x.id !== p.id));
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No pending approvals for this case.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {docsError && <p className="text-xs text-destructive">{docsError}</p>}

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <label className="flex-1">
                    <input
                      type="file"
                      className="block w-full text-sm"
                      disabled={loading || uploading || !id}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !id) return;
                        setSelectedDocFile(file);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading || uploading || !id || !selectedDocFile}
                    onClick={async () => {
                      if (!selectedDocFile || !id) return;
                      const file = selectedDocFile;
                      try {
                        setUploading(true);
                        setDocsError(null);
                        setUploadVisibility("mediator_only");

                        const signed = await api.createCaseDocumentSignedUpload(id, {
                          filename: file.name,
                          content_type: file.type || "application/octet-stream",
                        });

                        await fetch(signed.signed_url, {
                          method: "PUT",
                          headers: { "Content-Type": file.type || "application/octet-stream" },
                          body: file,
                        });

                        const created = await api.createCaseDocument(id, {
                          name: file.name,
                          storage_path: signed.path,
                          content_type: file.type || "application/octet-stream",
                          visibility: "mediator_only",
                        });

                        if (created) setDocuments((prev) => [created, ...prev]);
                        setSelectedDocFile(null);
                      } catch (err) {
                        setDocsError(err instanceof Error ? err.message : "Failed to upload document");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  >
                    Save draft
                  </Button>

                  <Button
                    size="sm"
                    disabled={loading || uploading || !id || !selectedDocFile}
                    onClick={async () => {
                      if (!selectedDocFile || !id) return;
                      const file = selectedDocFile;
                      try {
                        setUploading(true);
                        setDocsError(null);
                        setUploadVisibility("shared");

                        const signed = await api.createCaseDocumentSignedUpload(id, {
                          filename: file.name,
                          content_type: file.type || "application/octet-stream",
                        });

                        await fetch(signed.signed_url, {
                          method: "PUT",
                          headers: { "Content-Type": file.type || "application/octet-stream" },
                          body: file,
                        });

                        const created = await api.createCaseDocument(id, {
                          name: file.name,
                          storage_path: signed.path,
                          content_type: file.type || "application/octet-stream",
                          visibility: "shared",
                        });

                        if (created) setDocuments((prev) => [created, ...prev]);
                        setSelectedDocFile(null);
                      } catch (err) {
                        setDocsError(err instanceof Error ? err.message : "Failed to upload document");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  >
                    Send to parties
                  </Button>
                </div>

                {selectedDocFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: <span className="text-foreground font-medium">{selectedDocFile.name}</span>
                  </p>
                )}

                {docsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : documents.length ? (
                  <div className="space-y-2">
                    {documents
                      .slice()
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((d) => (
                        <div key={d.id} className="p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" title={d.name}>{d.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Visibility: {d.visibility.replaceAll("_", " ")} · v{d.version}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  setOpeningDocId(d.id);
                                  setDocsError(null);
                                  setPreviewOpen(true);
                                  setPreviewLoading(true);
                                  setPreviewDocName(d.name);
                                  setPreviewContentType(d.content_type);

                                  const url = await api.getCaseDocumentSignedUrl(d.id, { expires_in: 60 * 10 });
                                  if (!url) throw new Error("No signed URL returned");
                                  setPreviewDownloadUrl(url);

                                  const res = await fetch(url);
                                  if (!res.ok) throw new Error(`Failed to fetch document (${res.status})`);
                                  const blob = await res.blob();
                                  const blobUrl = URL.createObjectURL(blob);
                                  setPreviewBlobUrl(blobUrl);
                                } catch (err) {
                                  setDocsError(err instanceof Error ? err.message : "Failed to open document");
                                } finally {
                                  setOpeningDocId("");
                                  setPreviewLoading(false);
                                }
                              }}
                              disabled={openingDocId === d.id}
                            >
                              {openingDocId === d.id ? "Opening…" : "View"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (!confirm("Delete this document?")) return;
                                try {
                                  const deleted = await api.deleteCaseDocument(d.id);
                                  if (deleted) {
                                    setDocuments((prev) => prev.map((x) => (x.id === deleted.id ? deleted : x)).filter((x) => !x.is_deleted));
                                  } else {
                                    // If server returned no payload, just remove locally.
                                    setDocuments((prev) => prev.filter((x) => x.id !== d.id));
                                  }
                                } catch (err) {
                                  setDocsError(err instanceof Error ? err.message : "Failed to delete document");
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : sortedMessages.length ? (
                  sortedMessages.slice(0, 20).map((m) => (
                    <div key={m.id} className="p-3 border rounded-xl">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{new Date(m.created_at).toLocaleString()}</span>
                        {m.purpose ? <span>{m.purpose}</span> : <span>Message</span>}
                      </div>
                      <p className="text-sm mt-1">{m.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No messages found for this case.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="truncate" title={previewDocName}>
              {previewDocName || "Document"}
            </DialogTitle>
            <DialogDescription>
              Preview (download available)
            </DialogDescription>
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
    </ModeratorLayout>
  );
};

export default MediatorCase;
