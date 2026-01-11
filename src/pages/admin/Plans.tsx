import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Calendar } from "lucide-react";

const AdminPlans = () => {
  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Plans
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Plan List</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Search by Plan ID or client..." className="mb-4" />
            <div className="space-y-2">
              <div className="p-3 border rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-medium">Weekday / Weekend Split</p>
                  <p className="text-xs text-muted-foreground">Clients: Alex Johnson, Jordan Smith</p>
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

export default AdminPlans;
