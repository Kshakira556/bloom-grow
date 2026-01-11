import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
      </CardHeader>
      <CardContent>
        Configure system-wide settings and preferences.
      </CardContent>
    </Card>
  );
}
