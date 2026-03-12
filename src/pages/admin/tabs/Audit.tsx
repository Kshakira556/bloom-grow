import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import * as api from "@/lib/api";
import { buildUserNameMap } from "@/lib/adminData";

const Audit = () => {
  const [logs, setLogs] = useState<api.AuditLog[]>([]);
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [logsRes, usersRes] = await Promise.all([
          api.getAuditLogs(),
          api.getUsers(),
        ]);
        setLogs(logsRes);
        setUsers(usersRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Audit Logs</h2>

      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
          ) : logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 w-full">
                  <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                  <p className="text-xs font-medium">{userMap[log.actor_id] || log.actor_id}</p>
                  <p className="text-xs">{log.action}</p>
                  <p className="text-xs">{log.target_type || "-"}</p>
                  <p className="text-xs italic text-muted-foreground">{log.notes || "-"}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No logs to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;
