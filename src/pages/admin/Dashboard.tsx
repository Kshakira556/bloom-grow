import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Calendar, User, MessageSquare, FileText } from "lucide-react";
import { useState } from "react";

const stats = [
  { label: "Clients", value: "15", trend: "Active" },
  { label: "Plans", value: "8", trend: "Current month" },
  { label: "Children", value: "12", trend: "Across all plans" },
  { label: "Messages", value: "24", trend: "Reviewed this month" },
];

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Overview of system stats and recent activity</p>
          </div>
          <Button className="gap-2">
            <Calendar className="w-4 h-4" /> Schedule Review
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-display font-bold text-2xl mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Placeholder for recent activity / system notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
