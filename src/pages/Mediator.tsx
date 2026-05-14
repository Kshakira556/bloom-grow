import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { MediationRequestCard } from "@/components/mediation/MediationRequestCard";

export default function Mediator() {
  const { user } = useAuthContext();
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);
  const [loading, setLoading] = useState(false);

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

          <MediationRequestCard planId={activePlan?.id ?? null} disabled={loading || !user?.id} />
        </div>
      </main>
    </div>
  );
}

