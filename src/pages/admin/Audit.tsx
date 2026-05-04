import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Flag } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import * as api from "@/lib/api";
import type { MessagePurpose } from "@/types/messages";
import { buildUserNameMap, fetchAllPlanMessages } from "@/lib/adminData";

const formatDateTime = (value: string) => format(new Date(value), "yyyy-MM-dd HH:mm");

const AdminAudit = () => {
  const [purposeFilter, setPurposeFilter] = useState<MessagePurpose | "All">("All");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<api.ApiMessage[]>([]);
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [historyById, setHistoryById] = useState<Record<string, api.ApiMessageHistory[]>>({});
  const [auditLogs, setAuditLogs] = useState<api.AuditLog[]>([]);
  const [auditAction, setAuditAction] = useState<string>("All");
  const [auditSearch, setAuditSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersRes, plansRes] = await Promise.all([
          api.getUsers(),
          api.getPlans(),
        ]);

        const logsResPromise = api.getAuditLogs().catch(() => [] as api.AuditLog[]);

        const planList = plansRes?.plans ?? [];
        let allMessages: api.ApiMessage[] = [];
        try {
          allMessages = await api.getAdminMessages({ includeDeleted: true });
        } catch {
          // Safe fallback: preserve prior behavior if admin endpoint isn't available/authorized
          allMessages = await fetchAllPlanMessages(planList, { includeDeleted: true });
        }

        setUsers(usersRes);
        setMessages(allMessages);
        setAuditLogs(await logsResPromise);

        const historyEntries = await Promise.all(
          allMessages.slice(0, 200).map(async (msg) =>
            [msg.id, await api.getMessageHistory(msg.id)] as const
          )
        );
        setHistoryById(Object.fromEntries(historyEntries));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);

  const filteredMessages = useMemo(() => {
    return messages
      .filter((msg) => (purposeFilter === "All" ? true : msg.purpose === purposeFilter))
      .filter((msg) => {
        if (!search) return true;
        const sender = userMap[msg.sender_id] || msg.sender_id;
        const receiver = userMap[msg.receiver_id] || msg.receiver_id;
        return (
          sender.toLowerCase().includes(search.toLowerCase()) ||
          receiver.toLowerCase().includes(search.toLowerCase()) ||
          msg.content.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [messages, purposeFilter, search, userMap]);

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs
      .filter((log) => (auditAction === "All" ? true : log.action === auditAction))
      .filter((log) => {
        if (!q) return true;
        const actor = (userMap[log.actor_id] || log.actor_id).toLowerCase();
        const action = (log.action || "").toLowerCase();
        const target = (log.target_type || "").toLowerCase();
        const notes = (log.notes || "").toLowerCase();
        return (
          actor.includes(q) ||
          action.includes(q) ||
          target.includes(q) ||
          notes.includes(q) ||
          (log.target_id || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [auditLogs, auditAction, auditSearch, userMap]);

  const auditActions = useMemo(() => {
    const uniq = new Set<string>();
    for (const l of auditLogs) {
      if (l.action) uniq.add(l.action);
    }
    return ["All", ...Array.from(uniq).sort()];
  }, [auditLogs]);

  const exportAudit = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(12);
    doc.text("Audit Logs", 10, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 10, y);
    y += 8;

    filteredMessages.forEach((msg, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }

      const sender = userMap[msg.sender_id] || msg.sender_id;
      const receiver = userMap[msg.receiver_id] || msg.receiver_id;
      const isDeleted = Boolean(msg.is_deleted);

      doc.setFont(undefined, "bold");
      doc.text(
        `${idx + 1}. [${formatDateTime(msg.created_at)}] ${sender} ? ${receiver} (${msg.purpose || "General"})${
          isDeleted ? " [Deleted]" : ""
        }`,
        10,
        y
      );
      y += 6;

      doc.setFont(undefined, "normal");
      const currentLabel = isDeleted ? "Current (deleted)" : "Current";
      const lines = doc.splitTextToSize(`${currentLabel}: ${msg.content}`, 180);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 4;

      const history = historyById[msg.id] ?? [];
      if (history.length) {
        doc.setFont(undefined, "bold");
        doc.text("History", 12, y);
        y += 6;

        doc.setFont(undefined, "normal");
        history.forEach((entry) => {
          const label = `${entry.action_type.toUpperCase()} (${formatDateTime(entry.action_at)})`;
          const labelLines = doc.splitTextToSize(label, 180);
          doc.text(labelLines, 12, y);
          y += labelLines.length * 5;

          if (entry.content) {
            const contentLines = doc.splitTextToSize(`Content: ${entry.content}`, 176);
            doc.text(contentLines, 16, y);
            y += contentLines.length * 5;
          }

          y += 3;
        });
      }

      y += 4;
    });

    doc.save("audit-messages.pdf");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary" />
        Audit / Oversight
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Audit Actions (Sensitive Access & Exports)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Search by actor, action, target, notes..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap md:justify-end md:col-span-2">
              {auditActions.slice(0, 8).map((a) => (
                <button
                  key={a}
                  onClick={() => setAuditAction(a)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    auditAction === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                  title={a}
                >
                  {a === "All" ? "All" : a.replaceAll("_", " ")}
                </button>
              ))}
              {auditActions.length > 8 && (
                <select
                  value={auditAction}
                  onChange={(e) => setAuditAction(e.target.value)}
                  className="px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground"
                >
                  {auditActions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading audit actions...</p>
          ) : filteredAuditLogs.length > 0 ? (
            <div className="space-y-2">
              {filteredAuditLogs.slice(0, 200).map((log) => (
                <div key={log.id} className="p-3 border rounded-xl flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                    <span>{formatDateTime(log.created_at)}</span>
                    <span className="font-medium">{userMap[log.actor_id] || log.actor_id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary">
                      {log.action}
                    </span>
                    {log.target_type && (
                      <span className="px-2 py-0.5 rounded-full bg-muted">
                        {log.target_type}
                      </span>
                    )}
                    {log.target_id && <span className="font-mono text-[10px]">{log.target_id}</span>}
                  </div>
                  {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                </div>
              ))}
              {filteredAuditLogs.length > 200 && (
                <p className="text-xs text-muted-foreground">
                  Showing first 200 matching audit actions.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No audit actions to display.</p>
          )}
        </CardContent>
      </Card>

      <Input
        placeholder="Search by sender, recipient, or content..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <div className="flex gap-2 flex-wrap">
        {(["All", "General", "Legal", "Medical", "Safety", "Emergency", "Financial"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPurposeFilter(p)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              purposeFilter === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Message History</CardTitle>
          <Button size="sm" onClick={exportAudit} className="gap-2">
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => {
              const sender = userMap[msg.sender_id] || msg.sender_id;
              const receiver = userMap[msg.receiver_id] || msg.receiver_id;
              const history = historyById[msg.id] ?? [];
              const lastEdit = history
                .slice()
                .reverse()
                .find((entry) => entry.action_type === "update");

              return (
                <div key={msg.id} className="p-3 border rounded-xl flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                    <span>{formatDateTime(msg.created_at)}</span>
                    <span>{sender} ? {receiver}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary">
                      {msg.purpose || "General"}
                    </span>
                    {msg.is_flagged && <Flag className="w-4 h-4 text-red-500" />}
                    {msg.is_deleted && (
                      <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                        Deleted
                      </span>
                    )}
                  </div>

                  {lastEdit && (
                    <div className="text-xs text-orange-600 italic">
                      Edited on {formatDateTime(lastEdit.action_at)}
                    </div>
                  )}

                  <p className="text-sm">{msg.content}</p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No messages to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAudit;

