import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye } from "lucide-react";

const AdminMessages = () => {
  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Messages
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 border rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-medium">Alex → Jordan</p>
                  <p className="text-xs text-muted-foreground">Preview: "I can't believe you would..."</p>
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

export default AdminMessages;
