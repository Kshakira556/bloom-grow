import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, MessageSquare, FileText, 
  User, Mail, Phone, Calendar, Eye, ThumbsUp, ThumbsDown, } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const moderator = {
  name: "Sarah Mitchell",
  role: "Family Mediator",
  email: "sarah.mitchell@mediator.com",
  phone: "(555) 123-4567",
  avatar: "SM",
  assignedSince: "December 2023",
};

const flaggedMessages = [
  {
    id: 1,
    from: "Alex",
    to: "Jordan",
    date: "Today, 10:30 AM",
    preview: "I can't believe you would...",
    reason: "Detected negative language",
    status: "pending",
  },
  {
    id: 2,
    from: "Jordan",
    to: "Alex",
    date: "Yesterday",
    preview: "This is completely unfair and you know it...",
    reason: "Conflict escalation detected",
    status: "pending",
  },
  {
    id: 3,
    from: "Alex",
    to: "Jordan",
    date: "Jan 10, 2024",
    preview: "We need to talk about the schedule...",
    reason: "Mentioned schedule dispute",
    status: "resolved",
  },
];

const recentActions = [
  {
    id: 1,
    action: "Message reviewed",
    description: "Flagged message from Jan 10 was reviewed and approved",
    date: "Jan 11, 2024",
    icon: CheckCircle,
    color: "text-success",
  },
  {
    id: 2,
    action: "Mediation session scheduled",
    description: "Upcoming session to discuss holiday schedule",
    date: "Jan 15, 2024",
    icon: Calendar,
    color: "text-primary",
  },
  {
    id: 3,
    action: "Report generated",
    description: "Monthly communication summary sent to both parties",
    date: "Jan 1, 2024",
    icon: FileText,
    color: "text-cub-lavender",
  },
];

const stats = [
  { label: "Messages Reviewed", value: "24", trend: "This month" },
  { label: "Active Flags", value: "2", trend: "Pending review" },
  { label: "Resolved Issues", value: "12", trend: "Last 30 days" },
  { label: "Next Session", value: "Jan 15", trend: "Scheduled" },
];

const Moderator = () => {
  {/* Stats */}
        const newStats = [
          ...stats,
          { label: "Clients Managed", value: "15", trend: "Active" },
          { label: "Active Plans", value: "8", trend: "Current month" },
          { label: "Children Linked", value: "12", trend: "Across all plans" },
        ];
        const [activeTab, setActiveTab] = useState("flagged");
        
  return (
    <ModeratorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Moderation Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage communication oversight and conflict resolution
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Request Session
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-display font-bold text-2xl mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="flagged" className="space-y-4">
              <TabsList className="flex-wrap gap-2">
                <TabsTrigger value="flagged" className="gap-2">
                  <AlertTriangle className="w-4 h-4" /> Flagged Messages
                  <span className="ml-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    2
                  </span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="w-4 h-4" /> Review History
                </TabsTrigger>
                <TabsTrigger value="clients" className="gap-2">
                  <User className="w-4 h-4" /> Clients
                </TabsTrigger>
                <TabsTrigger value="plans" className="gap-2">
                  <Calendar className="w-4 h-4" /> Plans
                </TabsTrigger>
                <TabsTrigger value="children" className="gap-2">
                  <User className="w-4 h-4" /> Children
                </TabsTrigger>
                <TabsTrigger value="proposals" className="gap-2">
                  <FileText className="w-4 h-4" /> Proposed Changes
                </TabsTrigger>
              </TabsList>

              {/* Flagged Messages */}
              <TabsContent value="flagged"> ... </TabsContent>

              {/* Review History */}
              <TabsContent value="history"> ... </TabsContent>

              {/* Clients Tab */}
              <TabsContent value="clients">
                <Card>
                  <CardHeader>
                    <CardTitle>Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input placeholder="Search by name or plan ID..." className="mb-4" />
                    <div className="space-y-2">
                      {/* Example client */}
                      <div className="p-3 border rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-medium">Alex Johnson</p>
                          <p className="text-xs text-muted-foreground">Active Plans: 2</p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Plans Tab */}
              <TabsContent value="plans">
                <Card>
                  <CardHeader>
                    <CardTitle>Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input placeholder="Search by Plan ID or client..." className="mb-4" />
                    <div className="space-y-2">
                      <div className="p-3 border rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-medium">Weekday / Weekend Split</p>
                          <p className="text-xs text-muted-foreground">
                            Clients: Alex Johnson, Jordan Smith
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Children Tab */}
              <TabsContent value="children">
                <Card>
                  <CardHeader>
                    <CardTitle>Children</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input placeholder="Search by name or plan..." className="mb-4" />
                    <div className="space-y-2">
                      <div className="p-3 border rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-medium">Sophie Johnson</p>
                          <p className="text-xs text-muted-foreground">
                            Linked Parents: Alex Johnson, Jordan Smith
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Proposed Changes Tab */}
              <TabsContent value="proposals">
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
              </TabsContent>
            </Tabs>


            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Moderator Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <div key={action.id} className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${action.color}`} />
                        </div>
                        <div>
                          <p className="font-display font-bold">{action.action}</p>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{action.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Moderator Info */}
            <Card>
              <CardHeader>
                <CardTitle>Moderator Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                    {moderator.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{moderator.name}</p>
                    <p className="text-sm text-muted-foreground">{moderator.role}</p>
                    <p className="text-xs text-muted-foreground">{moderator.email}</p>
                    <p className="text-xs text-muted-foreground">{moderator.phone}</p>
                    <p className="text-xs text-muted-foreground">Assigned Since: {moderator.assignedSince}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full justify-start gap-2" 
                  onClick={() => setActiveTab("flagged")}
                >
                  <AlertTriangle className="w-4 h-4" /> Flagged Messages
                </Button>
                <Button 
                  size="sm" 
                  className="w-full justify-start gap-2" 
                  onClick={() => setActiveTab("history")}
                >
                  <Clock className="w-4 h-4" /> Review History
                </Button>
                <Button 
                  size="sm" 
                  className="w-full justify-start gap-2" 
                  onClick={() => setActiveTab("clients")}
                >
                  <User className="w-4 h-4" /> Clients
                </Button>
                <Button 
                  size="sm" 
                  className="w-full justify-start gap-2" 
                  onClick={() => setActiveTab("plans")}
                >
                  <Calendar className="w-4 h-4" /> Plans
                </Button>
                <Button 
                  size="sm" 
                  className="w-full justify-start gap-2" 
                  onClick={() => setActiveTab("children")}
                >
                  <User className="w-4 h-4" /> Children
                </Button>
                <Button 
                  size="sm" 
                  className="w-full justify-start gap-2" 
                  onClick={() => setActiveTab("proposals")}
                >
                  <FileText className="w-4 h-4" /> Proposed Changes
                </Button>
              </CardContent>
            </Card>


            {/* Communication Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>Always review messages flagged for sensitive language.</li>
                  <li>Ensure proposed plan changes are logged in the audit trail.</li>
                  <li>Moderation actions must be timely and justified with notes.</li>
                  <li>Keep communications professional and neutral at all times.</li>
                  <li>Escalate unresolved disputes to Admin when necessary.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </ModeratorLayout>
  );
};

export default Moderator;
