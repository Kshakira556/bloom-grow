import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SettingsTab = () => {
  const [emailTemplate, setEmailTemplate] = useState("");
  const [systemName, setSystemName] = useState("Bloom Grow App");

  const handleSave = () => {
    alert(`Saved Settings:\nSystem Name: ${systemName}\nEmail Template: ${emailTemplate}`);
    // TODO: connect to API
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Global Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>System Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">System Name</label>
            <Input 
              value={systemName} 
              onChange={(e) => setSystemName(e.target.value)} 
              placeholder="Enter system name" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email Template</label>
            <Textarea 
              value={emailTemplate} 
              onChange={(e) => setEmailTemplate(e.target.value)} 
              placeholder="Enter default email template" 
              rows={4} 
            />
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
