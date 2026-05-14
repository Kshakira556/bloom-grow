import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye } from "lucide-react";
import * as api from "@/lib/api";
import { fetchAllPlanMessages } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";

const AdminMessages = () => {
  const [messages, setMessages] = useState<api.ApiMessage[]>([]);
  const [plans, setPlans] = useState<api.ModeratorAssignedPlanWithClients[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCaseId = searchParams.get("case") || "";
  const showAllCases = selectedCaseId === "all";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const planList = await api.getMyModeratorAssignedPlansWithClients();

        // Default to first assigned case (case-first). Keep an "all cases" option for power users.
        if (!searchParams.get("case") && planList[0]?.id) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("case", planList[0]!.id);
            return next;
          });
        }

        let msgs: api.ApiMessage[] = [];
        if (showAllCases) {
          msgs = await fetchAllPlanMessages(planList, { includeDeleted: true });
        } else {
          const caseId = selectedCaseId || planList[0]?.id || "";
          if (caseId) {
            const res = await api.getMessagesByPlan(caseId, { includeDeleted: true, limit: 200 });
            msgs = res.messages ?? [];
          }
        }

        setPlans(planList);
        setMessages(msgs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCaseId]);

  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of plans) {
      for (const c of p.clients) map[c.id] = c.full_name;
    }
    return map;
  }, [plans]);
  const planMap = useMemo(() => {
    return plans.reduce<Record<string, string>>((acc, plan) => {
      acc[plan.id] = plan.title;
      return acc;
    }, {});
  }, [plans]);

  const sortedMessages = useMemo(() => {
    return messages
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [messages]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Messages
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <select
                value={selectedCaseId || (plans[0]?.id ?? "")}
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
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
                <option value="all">All cases</option>
              </select>
              <div className="text-xs text-muted-foreground self-center md:text-right">
                {showAllCases ? "All cases" : `Case: ${planMap[selectedCaseId] || selectedCaseId || "-"}`}
              </div>
            </div>

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              ) : sortedMessages.length > 0 ? (
                sortedMessages.slice(0, 50).map((msg) => (
                  <div key={msg.id} className="p-3 border rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {(userMap[msg.sender_id] || msg.sender_id)} {"->"} {(userMap[msg.receiver_id] || msg.receiver_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Plan: {planMap[msg.plan_id] || msg.plan_id}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Preview: "{msg.content}"
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="gap-1">
                      <Link to={`/admin/cases/${msg.plan_id}`}>
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No messages found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminMessages;


