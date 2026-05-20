import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";

const ROLE_PRIVILEGES: Record<"admin" | "mediator", string[]> = {
  admin: ["Manage Business", "Assign Mediators", "View Audit Logs"],
  mediator: ["Case Oversight", "View Messages"],
};

const Roles = () => {
  const [members, setMembers] = useState<api.BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getBusinessMembers();
        setMembers(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load roles");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activeMembers = useMemo(() => {
    return members
      .filter((m) => m.status === "active")
      .filter((m) => m.user?.role === "admin" || m.user?.role === "mediator");
  }, [members]);

  const getMemberRoles = (m: api.BusinessMember): Array<"admin" | "mediator"> => {
    const roles = Array.isArray(m.roles) ? m.roles : [];
    if (roles.length) return roles;
    const fallback = m.user?.role === "admin" ? (["admin"] as const) : (["mediator"] as const);
    return [...fallback];
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Roles & Permissions</h2>

      <Card>
        <CardHeader>
          <CardTitle>Business Members & Roles</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading roles...</p>
          ) : activeMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No business members found.</p>
          ) : (
            activeMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">{member.user?.full_name ?? member.member_user_id}</p>
                  <p className="text-xs text-muted-foreground">{member.user?.email ?? ""}</p>
                  {member.user?.role && (
                    <p className="text-xs mt-1">
                      <span className="text-muted-foreground">Role:</span>{" "}
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {member.user.role}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={getMemberRoles(member).includes("admin")}
                      onCheckedChange={async (checked) => {
                        if (!member.user?.id) return;
                        const current = getMemberRoles(member);
                        const next = checked
                          ? Array.from(new Set([...current, "admin"])) as Array<"admin" | "mediator">
                          : (current.filter((r) => r !== "admin") as Array<"admin" | "mediator">);
                        if (!next.length) return; // cannot clear all roles
                        try {
                          setSavingId(member.user.id);
                          setError(null);
                          await api.updateBusinessMemberRole(member.user.id, { roles: next });
                          const refreshed = await api.getBusinessMembers();
                          setMembers(refreshed);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Failed to update roles");
                        } finally {
                          setSavingId(null);
                        }
                      }}
                    />
                    <span>Admin</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={getMemberRoles(member).includes("mediator")}
                      onCheckedChange={async (checked) => {
                        if (!member.user?.id) return;
                        const current = getMemberRoles(member);
                        const next = checked
                          ? Array.from(new Set([...current, "mediator"])) as Array<"admin" | "mediator">
                          : (current.filter((r) => r !== "mediator") as Array<"admin" | "mediator">);
                        if (!next.length) return; // cannot clear all roles
                        try {
                          setSavingId(member.user.id);
                          setError(null);
                          await api.updateBusinessMemberRole(member.user.id, { roles: next });
                          const refreshed = await api.getBusinessMembers();
                          setMembers(refreshed);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Failed to update roles");
                        } finally {
                          setSavingId(null);
                        }
                      }}
                    />
                    <span>Mediator</span>
                  </label>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!member.user?.id || savingId === member.user?.id}
                    onClick={async () => {
                      if (!member.user?.id) return;
                      try {
                        setSavingId(member.user.id);
                        setError(null);
                        // Reset to mediator-only
                        await api.updateBusinessMemberRole(member.user.id, { roles: ["mediator"] });
                        const refreshed = await api.getBusinessMembers();
                        setMembers(refreshed);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to update roles");
                      } finally {
                        setSavingId(null);
                      }
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            ))
          )}

          <div className="text-xs text-muted-foreground">
            <p>Only two roles exist here: Admin and Mediator.</p>
            <p>Admins also have access to mediator tools where supported.</p>
            {savingId && <p>Saving…</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Roles;
