import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const overrides = [
  { id: 1, moderator: "Sarah Mitchell", plan: "Weekend Plan", action: "Override", date: "Jan 10, 2024" },
  { id: 2, moderator: "John Doe", plan: "Weekday Plan", action: "Override", date: "Jan 8, 2024" },
];

const Overrides = () => {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Overrides</h2>

      {overrides.map((o) => (
        <Card key={o.id}>
          <CardHeader>
            <CardTitle>{o.plan}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="text-sm">{o.moderator} performed an override</p>
              <p className="text-xs text-muted-foreground">{o.date}</p>
            </div>
            <Button size="sm" onClick={() => alert("Override details")}>View</Button>
          </CardContent>
        </Card>
      ))}
      {overrides.length === 0 && <p className="text-sm text-muted-foreground">No overrides recorded.</p>}
    </div>
  );
};

export default Overrides;
