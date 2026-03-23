import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye } from "lucide-react";
import * as api from "@/lib/api";
import { buildUserNameMap, fetchAllPlanMessages } from "@/lib/adminData";

const AdminMessages = () => {
  const [messages, setMessages] = useState<api.ApiMessage[]>([]);
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [plans, setPlans] = useState<api.Plan[]>([]);
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

        const planList = plansRes?.plans ?? [];
        const allMessages = await fetchAllPlanMessages(planList, {
          includeDeleted: true,
        });

        setUsers(usersRes);
        setPlans(planList);
        setMessages(allMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);
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

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              ) : sortedMessages.length > 0 ? (
                sortedMessages.slice(0, 50).map((msg) => (
                  <div key={msg.id} className="p-3 border rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {`${userMap[msg.sender_id] || msg.sender_id} -> ${userMap[msg.receiver_id] || msg.receiver_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Plan: {planMap[msg.plan_id] || msg.plan_id}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Preview: "{msg.content}"
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-4 h-4" /> View
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


