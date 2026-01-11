import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const auditLogs = [
  { id: 1, action: "Message reviewed", date: "Jan 10, 2024", user: "Sarah Mitchell" },
  { id: 2, action: "Plan change approved", date: "Jan 9, 2024", user: "John Doe" },
];

const Audit = () => {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Audit Logs</h2>

      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 border rounded-xl flex justify-between items-center">
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">By: {log.user}</p>
              </div>
              <p className="text-xs text-muted-foreground">{log.date}</p>
            </div>
          ))}
          {auditLogs.length === 0 && <p className="text-sm text-muted-foreground">No logs to display.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;
