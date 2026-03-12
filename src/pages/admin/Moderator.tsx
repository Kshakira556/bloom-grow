import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Eye,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as api from "@/lib/api";
import type { ReviewHistory } from "@/lib/api";
import { buildUserNameMap, fetchAllPlanMessages } from "@/lib/adminData";
import { useAuth } from "@/hooks/useAuth";

const Moderator = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("flagged");
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [children, setChildren] = useState<api.Child[]>([]);
  const [messages, setMessages] = useState<api.ApiMessage[]>([]);
  const [reviews, setReviews] = useState<ReviewHistory[]>([]);
  const [proposals, setProposals] = useState<api.Proposal[]>([]);
  const [resolvedFlagIds, setResolvedFlagIds] = useState<string[]>([]);
  const [reviewingIds, setReviewingIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersRes, plansRes, childrenRes, reviewRes, proposalRes] = await Promise.all([
          api.getUsers(),
          api.getPlans(),
          api.getChildren(),
          api.getReviewHistory(),
          api.getProposals("pending"),
        ]);

        const planList = plansRes?.plans ?? [];
        const allMessages = await fetchAllPlanMessages(planList, {
          includeDeleted: true,
        });

        setUsers(usersRes);
        setPlans(planList);
        setChildren(childrenRes);
        setMessages(allMessages);
        setReviews(reviewRes);
        setProposals(proposalRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load moderator data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);

  const flaggedMessages = useMemo(() => {
    return messages
      .filter((m) => m.is_flagged && !resolvedFlagIds.includes(m.id))
      .map((msg) => ({
        id: msg.id,
        from: userMap[msg.sender_id] || msg.sender_id,
        to: userMap[msg.receiver_id] || msg.receiver_id,
        date: new Date(msg.created_at).toLocaleString(),
        preview: msg.content,
        reason: msg.flagged_reason || "Flagged message",
        status: "pending" as const,
      }));
  }, [messages, userMap, resolvedFlagIds]);

  const handleReview = async (messageId: string, action: "approved" | "rejected", reason?: string) => {
    if (!user?.id) {
      setError("You must be signed in to submit reviews.");
      return;
    }

    try {
      setReviewingIds((prev) => ({ ...prev, [messageId]: true }));
      const review = await api.createReview({
        message_id: messageId,
        reviewer_id: user.id,
        action,
        notes: reason ? Reason:  : undefined,
      });
      if (review) {
        setReviews((prev) => [review, ...prev]);
      }
      setResolvedFlagIds((prev) => (prev.includes(messageId) ? prev : [...prev, messageId]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setReviewingIds((prev) => ({ ...prev, [messageId]: false }));
    }
  };
  const stats = useMemo(
    () => [
      { label: "Messages Reviewed", value: messages.length.toString(), trend: "All time" },
      { label: "Active Flags", value: flaggedMessages.length.toString(), trend: "Pending review" },
      { label: "Clients Managed", value: users.filter((u) => u.role === "parent").length.toString(), trend: "Active" },
      { label: "Active Plans", value: plans.length.toString(), trend: "Current" },
    ],
    [messages.length, flaggedMessages.length, users, plans]
  );

  const filteredClients = useMemo(() => users.filter((u) => u.role === "parent"), [users]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-display font-bold text-2xl mt-1">
                  {loading ? "..." : stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex-wrap gap-2">
                <TabsTrigger value="flagged" className="gap-2">
                  <AlertTriangle className="w-4 h-4" /> Flagged Messages
                  <span className="ml-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {flaggedMessages.length}
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

              <TabsContent value="flagged">
                <Card>
                  <CardHeader>
                    <CardTitle>Flagged Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading ? (
                      <p className="text-sm text-muted-foreground">Loading flagged messages...</p>
                    ) : flaggedMessages.length > 0 ? (
                      flaggedMessages.map((msg) => (
                        <div key={msg.id} className="p-3 border rounded-xl">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{msg.date}</span>
                            <span>{msg.from} -> {msg.to}</span>
                          </div>
                          <p className="text-sm mt-1">{msg.preview}</p>
                          <p className="text-xs text-destructive mt-1">{msg.reason}</p>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReview(msg.id, "approved", msg.reason)}
                              disabled={reviewingIds[msg.id]}
                            >
                              {reviewingIds[msg.id] ? "Saving..." : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReview(msg.id, "rejected", msg.reason)}
                              disabled={reviewingIds[msg.id]}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No flagged messages.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Review History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review.id} className="p-3 border rounded-xl">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{new Date(review.created_at).toLocaleString()}</span>
                              <span>Action: {review.action}</span>
                            </div>
                            {review.notes && <p className="text-xs mt-1">{review.notes}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No review history available.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients">
                <Card>
                  <CardHeader>
                    <CardTitle>Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input placeholder="Search by name or plan ID..." className="mb-4" />
                    <div className="space-y-2">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                          <div key={client.id} className="p-3 border rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-medium">{client.full_name}</p>
                              <p className="text-xs text-muted-foreground">Role: {client.role}</p>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Eye className="w-4 h-4" /> View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No clients found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="plans">
                <Card>
                  <CardHeader>
                    <CardTitle>Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input placeholder="Search by Plan ID or client..." className="mb-4" />
                    <div className="space-y-2">
                      {plans.length > 0 ? (
                        plans.map((plan) => (
                          <div key={plan.id} className="p-3 border rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-medium">{plan.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Created by: {userMap[plan.created_by ?? ""] || plan.created_by || "Unknown"}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Eye className="w-4 h-4" /> View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No plans found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="children">
                <Card>
                  <CardHeader>
                    <CardTitle>Children</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input placeholder="Search by name or plan..." className="mb-4" />
                    <div className="space-y-2">
                      {children.length > 0 ? (
                        children.map((child) => (
                          <div key={child.id} className="p-3 border rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-medium">{child.first_name} {child.last_name ?? ""}</p>
                              <p className="text-xs text-muted-foreground">
                                DOB: {child.birth_date ? new Date(child.birth_date).toLocaleDateString() : "-"}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Eye className="w-4 h-4" /> View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No children found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="proposals">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Plan Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {proposals.length > 0 ? (
                        proposals.map((proposal) => (
                          <div key={proposal.id} className="p-3 border rounded-xl">
                            <div>
                              <p className="font-medium">{proposal.title}</p>
                              <p className="text-xs text-muted-foreground">{proposal.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No pending proposals.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Moderator Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-display font-bold">No recent activity</p>
                      <p className="text-sm text-muted-foreground">Activity will appear here once available.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Moderator Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                    {(user?.full_name || "?")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{user?.full_name || "Moderator"}</p>
                    <p className="text-sm text-muted-foreground">{user?.role || "mediator"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "-"}</p>
                    <p className="text-xs text-muted-foreground">{user?.phone || "-"}</p>
                    <p className="text-xs text-muted-foreground">Assigned Since: -</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" /> Generate Report
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                  <AlertTriangle className="w-4 h-4" /> Review Flags
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                  <User className="w-4 h-4" /> Manage Clients
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ModeratorLayout>
  );
};

export default Moderator;






