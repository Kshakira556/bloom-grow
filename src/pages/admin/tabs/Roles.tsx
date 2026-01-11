import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const Roles = () => {
  const [role, setRole] = useState("");

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Roles & Permissions</h2>

      <Card>
        <CardHeader>
          <CardTitle>Assign Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User / Parent</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => alert(`Role assigned: ${role}`)}>Assign Role</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Roles;
