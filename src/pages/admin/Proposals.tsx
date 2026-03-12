import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ThumbsUp, ThumbsDown } from "lucide-react";
import * as api from "@/lib/api";
import { buildUserNameMap } from "@/lib/adminData";

const AdminProposals = () => {
  const [proposals, setProposals] = useState<api.Proposal[]>([]);
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [proposalsRes, usersRes] = await Promise.all([
          api.getProposals("pending"),
          api.getUsers(),
        ]);
        setProposals(proposalsRes);
        setUsers(usersRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load proposals");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);

  const handleUpdate = async (id: string, status: "approved" | "rejected") => {
    try {
      const updated = await api.updateProposalStatus(id, { status });
      if (!updated) return;
      setProposals((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update proposal");
    }
  };

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Proposed Changes
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Pending Plan Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading proposals...</p>
            ) : proposals.length > 0 ? (
              <div className="space-y-2">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="p-3 border rounded-xl flex justify-between items-center bg-warning/10"
                  >
                    <div>
                      <p className="font-medium">{proposal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Proposed by: {userMap[proposal.created_by] || proposal.created_by}
                      </p>
                      <p className="text-xs text-muted-foreground">{proposal.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-success"
                        onClick={() => handleUpdate(proposal.id, "approved")}
                      >
                        <ThumbsUp className="w-4 h-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-destructive"
                        onClick={() => handleUpdate(proposal.id, "rejected")}
                      >
                        <ThumbsDown className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending proposals.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminProposals;
