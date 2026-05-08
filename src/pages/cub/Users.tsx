import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as api from "@/lib/api";

export default function CubUsers() {
  const [role, setRole] = useState<api.UserRole | "all">("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<api.CubUserListRow[]>([]);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCubUsers({ role, q: q.trim() || undefined, limit: 200, offset: 0 });
      setRows(res.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((r) => {
      const text = `${r.full_name ?? ""} ${r.email ?? ""} ${r.role ?? ""}`.toLowerCase();
      return text.includes(query);
    });
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground mt-1">CUB Internal user management.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as api.UserRole | "all")}
              className="px-3 py-2 rounded-lg border bg-secondary/30 text-sm"
            >
              <option value="all">All roles</option>
              <option value="parent">Parent</option>
              <option value="mediator">Mediator</option>
              <option value="admin">Admin</option>
              <option value="cub_internal">CUB Internal</option>
            </select>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name/email/role"
            />
            <Button variant="outline" onClick={load} disabled={loading}>
              Apply
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-muted-foreground">No users found.</div>
            ) : (
              filtered.map((u) => (
                <div key={u.id} className="p-3 border rounded-lg bg-secondary/10 flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.email} · {u.role} · {u.account_type ?? "n/a"} · {u.subscription_status ?? "n/a"}
                        {u.deleted_at ? " · deleted" : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        children: {u.children_count ?? 0} · plans: {u.plans_count ?? 0}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingUserId === u.id}
                        onClick={async () => {
                          const confirmed = window.confirm(
                            `Activate paid subscription for ${u.email}?\n\nThis sets:\n- account_type = paid\n- subscription_status = active\n- trial_ends_at = NULL`
                          );
                          if (!confirmed) return;
                          setProcessingUserId(u.id);
                          try {
                            await api.cubActivatePaidUser(u.id);
                            await load();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Failed to activate paid subscription");
                          } finally {
                            setProcessingUserId(null);
                          }
                        }}
                      >
                        Set paid active
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(u.deleted_at) || processingUserId === u.id}
                        onClick={async () => {
                          const confirmed = window.confirm(`Soft delete ${u.email}?`);
                          if (!confirmed) return;
                          setProcessingUserId(u.id);
                          try {
                            await api.cubSoftDeleteUser(u.id);
                            await load();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Soft delete failed");
                          } finally {
                            setProcessingUserId(null);
                          }
                        }}
                      >
                        Soft delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingUserId === u.id}
                        onClick={async () => {
                          const checklist = [
                            "This is permanent and cannot be undone.",
                            "This deletes the user row and attempts to delete all associated records derived from the codebase.",
                            "If any table still references this user via a foreign key, the operation will fail (to avoid orphans).",
                            "Vault/child data is NOT directly deleted unless it is owned only by this user (not assumed).",
                          ].join("\n- ");

                          const typeConfirm = window.prompt(
                            `Hard delete ${u.email}?\n\nRead before continuing:\n- ${checklist}\n\nType DELETE to continue:`
                          );
                          if (typeConfirm !== "DELETE") return;

                          const password = window.prompt("Enter your CUB Internal password to confirm hard delete:");
                          if (!password) return;
                          setProcessingUserId(u.id);
                          try {
                            await api.cubHardDeleteUser(u.id, { confirm_password: password });
                            await load();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Hard delete failed");
                          } finally {
                            setProcessingUserId(null);
                          }
                        }}
                      >
                        Hard delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
