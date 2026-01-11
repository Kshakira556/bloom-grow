import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, User } from "lucide-react";

const AdminChildren = () => {
  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Children
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Child List</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Search by name or plan..." className="mb-4" />
            <div className="space-y-2">
              <div className="p-3 border rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-medium">Sophie Johnson</p>
                  <p className="text-xs text-muted-foreground">Linked Parents: Alex Johnson, Jordan Smith</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1">
                  <Eye className="w-4 h-4" /> View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminChildren;
