import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Calendar } from "lucide-react";
import * as api from "@/lib/api";
import { fetchAllPlanMessages } from "@/lib/adminData";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientCount, setClientCount] = useState(0);
  const [planCount, setPlanCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [messagesThisMonth, setMessagesThisMonth] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [users, plansRes, children] = await Promise.all([
          api.getUsers(),
          api.getPlans(),
          api.getChildren(),
        ]);

        const plans = plansRes?.plans ?? [];
        const parents = users.filter((u) => u.role === "parent");

        const allMessages = await fetchAllPlanMessages(plans, {
          includeDeleted: true,
        });

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const thisMonthCount = allMessages.filter((m) => {
          const d = new Date(m.created_at);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        setClientCount(parents.length);
        setPlanCount(plans.length);
        setChildCount(children.length);
        setMessagesThisMonth(thisMonthCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Clients", value: clientCount.toString(), trend: "Parents" },
      { label: "Plans", value: planCount.toString(), trend: "All plans" },
      { label: "Children", value: childCount.toString(), trend: "Across all plans" },
      { label: "Messages", value: messagesThisMonth.toString(), trend: "This month" },
    ],
    [clientCount, planCount, childCount, messagesThisMonth]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Overview of system stats and recent activity
            </p>
          </div>
          <Button className="gap-2">
            <Calendar className="w-4 h-4" /> Schedule Review
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-display font-bold text-2xl mt-1">
                  {loading ? "..." : stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
