import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useModeratorsStore } from "../store/useModeratorsStore";
import { useState } from "react";

const Audit = () => {
  const { moderators } = useModeratorsStore();
  const [filter, setFilter] = useState<"All" | "User" | "Moderator" | "Admin">("All");
  const tabs: Array<"All" | "User" | "Moderator" | "Admin"> = ["All", "User", "Moderator", "Admin"];
  const [search, setSearch] = useState(""); 
  const [sortAsc, setSortAsc] = useState(true); 
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({}); 

  const isModerator = filter === "Moderator";
  const allLogs = moderators
    .filter(mod => !isModerator || mod.role === "Moderator") 
    .map((mod) => ({
      id: mod.id,
      actor: mod.name,
      role: mod.role,
      action: "Logged in",
      target: "Dashboard",
      timestamp: new Date().toISOString(),
      notes: mod.privileges?.join(", ") || "No privileges",
    }));

  const filteredLogs = allLogs
    .filter((log) =>
      filter === "All" ? true : log.role.toLowerCase() === filter.toLowerCase()
    )
    .filter((log) =>
      search
        ? log.actor.toLowerCase().includes(search.toLowerCase()) ||
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.target.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .filter((log) => {
      if (!dateRange.from && !dateRange.to) return true;
      const logDate = new Date(log.timestamp);
      if (dateRange.from && logDate < dateRange.from) return false;
      if (dateRange.to && logDate > dateRange.to) return false;
      return true;
    })
    .sort((a, b) =>
      sortAsc
        ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Audit Logs</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setFilter(tab)} 
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table/Card View */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {allLogs.length > 0 ? (
            <>
              {/* Column Headings */}
              <div className="hidden md:grid grid-cols-5 gap-2 w-full font-semibold text-xs text-muted-foreground mb-1">
                <span>Timestamp</span>
                <span>Actor</span>
                <span>Role</span>
                <span>Action → Target</span>
                <span>Notes</span>
              </div>

              {/* Rows */}
              {allLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 w-full">
                    <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                    <p className="text-xs font-medium">{log.actor}</p>
                    <p className="text-xs">{log.role}</p>
                    <p className="text-xs">{log.action} → {log.target}</p>
                    <p className="text-xs italic text-muted-foreground">{log.notes}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No logs to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;
