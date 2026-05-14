import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as api from "@/lib/api";
import type { ReviewHistory } from "@/lib/api";
import { fetchAllPlanMessages } from "@/lib/adminData";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Moderator = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("flagged");
  const [plans, setPlans] = useState<api.ModeratorAssignedPlanWithClients[]>([]);
  const [messages, setMessages] = useState<api.ModeratorFlaggedMessage[]>([]);
  const [reviews, setReviews] = useState<ReviewHistory[]>([]);
  const [resolvedFlagIds, setResolvedFlagIds] = useState<string[]>([]);
  const [reviewingIds, setReviewingIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [assignedPlansRes, reviewRes] = await Promise.all([
          api.getMyModeratorAssignedPlansWithClients(),
          api.getReviewHistory(),
        ]);

        const planList = assignedPlansRes ?? [];
        let allMessages: api.ModeratorFlaggedMessage[] = [];
        try {
          allMessages = await api.getMyModeratorFlaggedMessages({ includeDeleted: true });
        } catch {
          allMessages = (await fetchAllPlanMessages(planList, { includeDeleted: true })) as unknown as api.ModeratorFlaggedMessage[];
        }

        setPlans(planList);
        setMessages(allMessages);
        setReviews(reviewRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load moderator data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);
  const planTitleById = useMemo(() => {
    return plans.reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = p.title;
      return acc;
    }, {});
  }, [plans]);

  const flaggedMessages = useMemo(() => {
    return messages
      .filter((m) => m.is_flagged && !resolvedFlagIds.includes(m.id))
      .map((msg) => ({
        id: msg.id,
        plan_id: msg.plan_id,
        from: msg.sender_name || msg.sender_id,
        to: msg.receiver_name || msg.receiver_id,
        date: new Date(msg.created_at).toLocaleString(),
        preview: msg.content,
        reason: msg.flagged_reason || "Flagged message",
        status: "pending" as const,
      }));
  }, [messages, resolvedFlagIds]);

  const flaggedByCase = useMemo(() => {
    return flaggedMessages.reduce<Record<string, typeof flaggedMessages>>((acc, m) => {
      acc[m.plan_id] = acc[m.plan_id] ?? [];
      acc[m.plan_id]!.push(m);
      return acc;
    }, {});
  }, [flaggedMessages]);

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
        notes: reason ? reason: undefined,
      });
      if (review) {
        setReviews((prev) => [review, ...prev]);
      }
      setResolvedFlagIds((prev) => (prev.includes(messageId) ? prev : [...prev, messageId]));
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                is_flagged: action === "rejected",
                flagged_reason: action === "approved" ? null : (reason ?? message.flagged_reason),
              }
            : message
        )
      );
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
      { label: "Clients Managed", value: plans.reduce((acc, p) => acc + (p.clients?.length ?? 0), 0).toString(), trend: "Across cases" },
      { label: "Active Plans", value: plans.length.toString(), trend: "Current" },
    ],
    [messages.length, flaggedMessages.length, plans]
  );

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Triage
            </h1>
            <p className="text-muted-foreground mt-1">
              Review flagged items and keep cases on track
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Request Session
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full overflow-x-auto whitespace-nowrap gap-2 justify-start md:flex-wrap">
                <TabsTrigger value="flagged" className="gap-2">
                  <AlertTriangle className="w-4 h-4" /> Flagged Messages
                  <span className="ml-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {flaggedMessages.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="w-4 h-4" /> Review History
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
                      Object.entries(flaggedByCase).map(([planId, caseMsgs]) => (
                        <div key={planId} className="p-3 border rounded-xl space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="font-medium">{planTitleById[planId] || planId}</p>
                              <p className="text-xs text-muted-foreground">{caseMsgs.length} flagged message{caseMsgs.length === 1 ? "" : "s"}</p>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/admin/cases/${planId}`}>Open case</Link>
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {caseMsgs.map((msg) => (
                              <div key={msg.id} className="p-3 border rounded-xl bg-warning/10">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{msg.date}</span>
                                  <span>{msg.from} {"->"} {msg.to}</span>
                                </div>
                                <p className="text-sm mt-1">{msg.preview}</p>
                                <p className="text-xs text-destructive mt-1">{msg.reason}</p>
                                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                  <Button
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleReview(msg.id, "approved", msg.reason)}
                                    disabled={reviewingIds[msg.id]}
                                  >
                                    {reviewingIds[msg.id] ? "Saving..." : "Approve"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleReview(msg.id, "rejected")}
                                    disabled={reviewingIds[msg.id]}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
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
                <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                  <AlertTriangle className="w-4 h-4" /> Review Flags
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






