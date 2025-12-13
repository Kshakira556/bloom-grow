import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  return (
    <DashboardLayout>
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

        {/* Stats */}
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

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="flagged" className="space-y-4">
              <TabsList>
                <TabsTrigger value="flagged" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Flagged Messages
                  <span className="ml-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    2
                  </span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Review History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="flagged">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages Requiring Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {flaggedMessages.filter(m => m.status === "pending").map((msg) => (
                        <div
                          key={msg.id}
                          className="p-4 border border-warning/30 bg-warning/5 rounded-xl"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-cub-coral-light flex items-center justify-center">
                                    <span className="text-xs font-bold text-cub-coral">
                                      {msg.from[0]}
                                    </span>
                                  </div>
                                  <span className="font-medium">{msg.from}</span>
                                </div>
                                <span className="text-muted-foreground">→</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-cub-sage-light flex items-center justify-center">
                                    <span className="text-xs font-bold text-cub-sage">
                                      {msg.to[0]}
                                    </span>
                                  </div>
                                  <span className="font-medium">{msg.to}</span>
                                </div>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {msg.date}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm mb-2">
                                "{msg.preview}"
                              </p>
                              <span className="inline-flex items-center gap-1 text-xs bg-warning/20 text-warning px-2 py-1 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                {msg.reason}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-1 text-success">
                                <ThumbsUp className="w-4 h-4" />
                                Approve
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-1 text-destructive">
                                <ThumbsDown className="w-4 h-4" />
                                Flag
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Review History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {flaggedMessages.filter(m => m.status === "resolved").map((msg) => (
                        <div
                          key={msg.id}
                          className="p-4 bg-secondary/50 rounded-xl"
                        >
                          <div className="flex items-start gap-4">
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium">{msg.from}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">{msg.to}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {msg.date}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                "{msg.preview}"
                              </p>
                              <span className="text-xs text-success mt-2 inline-block">
                                Resolved
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Your Moderator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-cub-lavender-light flex items-center justify-center">
                    <span className="font-display font-bold text-xl text-cub-lavender">
                      {moderator.avatar}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold">{moderator.name}</h3>
                    <p className="text-sm text-muted-foreground">{moderator.role}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{moderator.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{moderator.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Assigned since {moderator.assignedSince}</span>
                  </div>
                </div>
                <Button className="w-full mt-6" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Moderator
                </Button>
              </CardContent>
            </Card>

            {/* Communication Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Keep messages focused on children's needs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Use respectful, neutral language</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Avoid discussing past conflicts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Respond within 24 hours when possible</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Moderator;
