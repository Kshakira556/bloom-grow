import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ThumbsUp, ThumbsDown } from "lucide-react";

const AdminProposals = () => {
  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Proposed Changes
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Pending Plan Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 border rounded-xl flex justify-between items-center bg-warning/10">
                <div>
                  <p className="font-medium">Alex Johnson → Weekend Plan Change</p>
                  <p className="text-xs text-muted-foreground">Proposed: Swap Saturday visit</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="gap-1 text-success">
                    <ThumbsUp className="w-4 h-4" /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive">
                    <ThumbsDown className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminProposals;
