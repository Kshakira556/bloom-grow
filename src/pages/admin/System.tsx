import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Moderators from "./tabs/Moderators";
import Roles from "./tabs/Roles";
import Audit from "./tabs/Audit";
import Reports from "./tabs/Reports";
import SettingsTab from "./tabs/Settings";
import Overrides from "./tabs/Overrides";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("moderators");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap gap-2">
            <TabsTrigger value="moderators">Moderators</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
            <TabsTrigger value="overrides">Overrides</TabsTrigger>
          </TabsList>

          <TabsContent value="moderators"><Moderators /></TabsContent>
          <TabsContent value="roles"><Roles /></TabsContent>
          <TabsContent value="audit"><Audit /></TabsContent>
          <TabsContent value="reports"><Reports /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="overrides"><Overrides /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Admin;
