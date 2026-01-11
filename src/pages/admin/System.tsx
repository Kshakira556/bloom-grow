import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("moderators");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap gap-2">
            <TabsTrigger value="moderators">Moderators</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="overrides">Overrides</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="moderators">
            <Card>
              <CardHeader><CardTitle>Manage Moderators</CardTitle></CardHeader>
              <CardContent>Coming soon...</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader><CardTitle>Global Settings</CardTitle></CardHeader>
              <CardContent>Coming soon...</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader>
              <CardContent>Coming soon...</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader><CardTitle>System Reports</CardTitle></CardHeader>
              <CardContent>Coming soon...</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overrides">
            <Card>
              <CardHeader><CardTitle>Override Decisions</CardTitle></CardHeader>
              <CardContent>Coming soon...</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader><CardTitle>Roles & Permissions</CardTitle></CardHeader>
              <CardContent>Coming soon...</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Admin;
