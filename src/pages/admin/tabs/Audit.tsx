import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Audit() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        View system events and user actions for auditing purposes.
      </CardContent>
    </Card>
  );
}
