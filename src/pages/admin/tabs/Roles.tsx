import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as api from "@/lib/api";

const ROLE_PRIVILEGES: Record<"admin" | "mediator", string[]> = {
  admin: ["Manage Business", "Assign Mediators", "View Audit Logs"],
  mediator: ["Case Oversight", "View Messages"],
};

const AVAILABLE_ROLES: Array<{ label: string; value: "admin" | "mediator" }> = [
  { label: "Admin", value: "admin" },
  { label: "Mediator", value: "mediator" },
];

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

                <Select
                  value={(member.user?.role as "admin" | "mediator" | undefined) ?? ""}
                  onValueChange={async (newRole) => {
                    if (newRole !== "admin" && newRole !== "mediator") return;
                    if (!member.user?.id) return;

                    try {
                      setSavingId(member.user.id);
                      await api.updateBusinessMemberRole(member.user.id, newRole);
                      const refreshed = await api.getBusinessMembers();
                      setMembers(refreshed);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to update role");
                    } finally {
                      setSavingId(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Assign role" />
                  </SelectTrigger>

                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label} — {ROLE_PRIVILEGES[role.value].join(", ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

