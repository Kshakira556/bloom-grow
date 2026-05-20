import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye } from "lucide-react";
import * as api from "@/lib/api";

const Moderators = () => {
  const [moderators, setModerators] = useState<api.SafeUser[]>([]);
  const [members, setMembers] = useState<api.BusinessMember[]>([]);
  const [assignments, setAssignments] = useState<api.ModeratorAssignment[]>([]);
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [membersRes, assignmentsRes, plansRes] = await Promise.all([
          api.getBusinessMembers(),
          api.getModeratorAssignments(),
          api.getPlans(),
        ]);

        setMembers(membersRes);
        const memberUsers = membersRes
          .filter((m) => m.role_in_business === "mediator" && m.status === "active")
          .map((m) => m.user)
          .filter((u): u is api.SafeUser => Boolean(u));

        setModerators(memberUsers);
        setAssignments(assignmentsRes);
        setPlans(plansRes?.plans ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load moderators");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const planMap = useMemo(() => {
    return plans.reduce<Record<string, string>>((acc, plan) => {
      acc[plan.id] = plan.title;
      return acc;
    }, {});
  }, [plans]);

  const filtered = useMemo(() => {
    return moderators.filter((mod) =>
      search
        ? mod.full_name.toLowerCase().includes(search.toLowerCase()) ||
          mod.email.toLowerCase().includes(search.toLowerCase())
        : true
    );
  }, [moderators, search]);

  const onInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    try {
      setInviting(true);
      setInviteStatus(null);
      setError(null);

      const res = await api.inviteBusinessMemberByEmail({
        email,
        role_in_business: "mediator",
      });

      if ("linked_existing" in res && res.linked_existing) {
        setInviteStatus("Moderator linked to your business.");
      } else if ("invite_sent" in res && res.invite_sent) {
        setInviteStatus("Invite email sent.");
      } else {
        setInviteStatus("Done.");
      }

      // Refresh list (safe + simple)
      const membersRes = await api.getBusinessMembers();
      setMembers(membersRes);
      const memberUsers = membersRes
        .filter((m) => m.role_in_business === "mediator" && m.status === "active")
        .map((m) => m.user)
        .filter((u): u is api.SafeUser => Boolean(u));
      setModerators(memberUsers);
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite moderator");
    } finally {
      setInviting(false);
    }
  };

  const onDisable = async (memberUserId: string) => {
    try {
      setError(null);
      await api.updateBusinessMemberStatus(memberUserId, { status: "disabled" });
      const refreshed = await api.getBusinessMembers();
      setMembers(refreshed);
      const memberUsers = refreshed
        .filter((m) => m.role_in_business === "mediator" && m.status === "active")
        .map((m) => m.user)
        .filter((u): u is api.SafeUser => Boolean(u));
      setModerators(memberUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable moderator");
    }
  };

  const onEnable = async (memberUserId: string) => {
    try {
      setError(null);
      await api.updateBusinessMemberStatus(memberUserId, { status: "active" });
      const refreshed = await api.getBusinessMembers();
      setMembers(refreshed);
      const memberUsers = refreshed
        .filter((m) => m.role_in_business === "mediator" && m.status === "active")
        .map((m) => m.user)
        .filter((u): u is api.SafeUser => Boolean(u));
      setModerators(memberUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable moderator");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Moderators</h2>

      <Card>
        <CardHeader>
          <CardTitle>Invite Moderator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="moderator@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={onInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Inviting..." : "Invite / Add"}
            </Button>
          </div>
          {inviteStatus && <p className="text-sm text-muted-foreground">{inviteStatus}</p>}
          <p className="text-xs text-muted-foreground">
            Moderators are added to your business by exact email only (no global directory search).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Moderators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading moderators...</p>
          ) : filtered.length > 0 ? (
            filtered.map((mod) => {
              const assignedPlans = assignments.filter((a) => a.moderator_id === mod.id);
              const member = members.find((m) => m.member_user_id === mod.id);
              return (
                <div key={mod.id} className="p-3 border rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-medium">{mod.full_name}</p>
                    <p className="text-xs text-muted-foreground">{mod.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Assigned plans: {assignedPlans.length}
                    </p>
                    {member?.status && (
                      <p className="text-xs text-muted-foreground">
                        Status: <span className="font-medium">{member.status}</span>
                      </p>
                    )}
                    {assignedPlans.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {assignedPlans.slice(0, 3).map((assignment) => (
                          <div key={assignment.id}>
                            {planMap[assignment.plan_id] || assignment.plan_id}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {member?.status === "active" ? (
                      <Button size="sm" variant="outline" onClick={() => onDisable(mod.id)}>
                        Disable
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => onEnable(mod.id)}>
                        Enable
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No moderators found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Moderators;
