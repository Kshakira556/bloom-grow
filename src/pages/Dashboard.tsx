import { Navbar } from "@/components/layout/Navbar";
import { Link } from "react-router-dom";
import { Lock, Car, ClipboardList, Star, Bookmark } from "lucide-react";
import * as api from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import type { VisitEvent } from "@/types/visits";
import { mapVisitsToEvents } from "@/lib/mappers/visitMapper";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { DateTime } from "luxon";
import { Pagination, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { toast } = useToast(); 
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 5; 
  const { user } = useAuthContext();

  const [activePlanId, setActivePlanId] = useState<string>(() => {
    try {
      return localStorage.getItem("active_plan_id") ?? "";
    } catch {
      return "";
    }
  });

  const plansQuery = useQuery({
    queryKey: ["plans"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { plans } = await api.getPlans();
      return plans ?? [];
    },
  });

  useEffect(() => {
    const plans = plansQuery.data ?? [];
    if (!plans.length) {
      setActivePlanId("");
      return;
    }

    const stored = activePlanId;
    const exists = stored && plans.some((p) => p.id === stored);
    const next = exists ? stored : plans[0]!.id;

    if (next !== activePlanId) {
      setActivePlanId(next);
      try {
        localStorage.setItem("active_plan_id", next);
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plansQuery.data]);

  const activePlanQuery = useQuery({
    queryKey: ["plan", activePlanId],
    enabled: Boolean(user) && Boolean(activePlanId),
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { plan } = await api.getPlanById(activePlanId);
      return plan;
    },
  });

  const childrenQuery = useQuery({
    queryKey: ["children"],
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
    queryFn: async () => await api.getChildren(),
  });

  const visitsQuery = useQuery({
    queryKey: ["visits", activePlanId, user?.id],
    enabled: Boolean(user) && Boolean(activePlanId),
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.getVisitsByPlan(activePlanId);
      return data ?? [];
    },
  });

  const events: VisitEvent[] = useMemo(() => {
    if (!user) return [];
    const data = visitsQuery.data ?? [];
    return mapVisitsToEvents(data, user.id);
  }, [visitsQuery.data, user]);

  const dashboardSummaryQuery = useQuery({
    queryKey: ["dashboardSummary", activePlanId, currentPage],
    enabled: Boolean(user) && Boolean(activePlanId),
    staleTime: 15_000,
    queryFn: async () => {
      return api.getDashboardSummary({
        plan_id: activePlanId,
        unread_limit: messagesPerPage,
        unread_offset: (currentPage - 1) * messagesPerPage,
      });
    },
  });

  const plans = plansQuery.data ?? [];
  const activePlan = activePlanQuery.data ?? null;
  const children = childrenQuery.data ?? [];

  const remainingVisitsCount = events.length;

  const firstChildId = children[0]?.id ?? "";
  const journalCountQuery = useQuery({
    queryKey: ["journalCount", firstChildId],
    enabled: Boolean(user) && Boolean(activePlanId) && Boolean(firstChildId),
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const entries = await api.getJournalEntriesByChild(firstChildId);
      return entries.length;
    },
  });
  const journalEntriesCount = journalCountQuery.data ?? 0;

  const allUnreadMessages = useMemo(() => {
    const total = dashboardSummaryQuery.data?.unread_messages?.count ?? 0;
    // Only used for pagination sizing.
    return Array.from({ length: total }, () => ({ message: "", created_at: "" }));
  }, [dashboardSummaryQuery.data?.unread_messages?.count]);

  const unreadMessages = useMemo(() => {
    const preview = dashboardSummaryQuery.data?.unread_messages?.preview ?? [];
    return preview.map((msg) => ({
      message: msg.content,
      time: DateTime.fromISO(msg.created_at).setZone("local").toFormat("hh:mm a"),
      href: "/messages",
      description: "Unread Messages",
    }));
  }, [dashboardSummaryQuery.data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activePlanId]);

  useEffect(() => {
    if (!user?.id) return;
    if (!activePlanId) return;

    // Warm caches for likely next navigation targets.
    void queryClient.prefetchQuery({
      queryKey: ["plan", activePlanId],
      queryFn: async () => {
        const res = await api.getPlanById(activePlanId);
        return res.plan;
      },
      staleTime: 2 * 60_000,
    });

    void queryClient.prefetchQuery({
      queryKey: ["dashboardSummary", activePlanId, 1],
      queryFn: () =>
        api.getDashboardSummary({
          plan_id: activePlanId,
          unread_limit: messagesPerPage,
          unread_offset: 0,
        }),
      staleTime: 15_000,
    });

    // Parent mediator shared workspace prefetch (safe: returns [] if none).
    void queryClient.prefetchQuery({
      queryKey: ["planMediators", activePlanId],
      queryFn: () => api.getPlanMediators(activePlanId),
      staleTime: 60_000,
    });
    void queryClient.prefetchQuery({
      queryKey: ["sharedDocs", activePlanId],
      queryFn: () => api.getSharedCaseDocuments(activePlanId),
      staleTime: 60_000,
    });
    void queryClient.prefetchQuery({
      queryKey: ["sharedSessions", activePlanId],
      queryFn: () => api.getSharedMediatorSessions(activePlanId),
      staleTime: 30_000,
    });
    void queryClient.prefetchQuery({
      queryKey: ["planDecisions", activePlanId],
      queryFn: () => api.getPlanDecisions(activePlanId),
      staleTime: 60_000,
    });
  }, [activePlanId, queryClient, user?.id]);

  useEffect(() => {
    const err =
      plansQuery.error ||
      activePlanQuery.error ||
      visitsQuery.error ||
      dashboardSummaryQuery.error ||
      childrenQuery.error ||
      journalCountQuery.error;

    if (!err) return;
    if (err instanceof Error && err.message === "Unauthorized") return;

    toast({
      title: "Some dashboard data failed to load",
      description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      variant: "destructive",
      action: (
        <ToastAction
          onClick={() => {
            plansQuery.refetch();
            activePlanQuery.refetch();
            visitsQuery.refetch();
            dashboardSummaryQuery.refetch();
            childrenQuery.refetch();
            journalCountQuery.refetch();
          }}
          altText="Retry loading"
        >
          Retry
        </ToastAction>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plansQuery.error,
    activePlanQuery.error,
    visitsQuery.error,
    dashboardSummaryQuery.error,
    childrenQuery.error,
    journalCountQuery.error,
  ]);

  const quickLinks = [
    {
      icon: Lock,
      label: "Vault",
      number: children.length, 
      href: "/children",
      description: "takes you to the vault of child info",
      bgColor: "bg-primary",
      iconColor: "text-primary-foreground",
    },
    {
      icon: Car,
      label: "Visits",
      number: remainingVisitsCount,
      href: "/visits",
      description: "takes you to the visits page",
      bgColor: "bg-cub-green",
      iconColor: "text-primary-foreground",
    },
    {
      icon: ClipboardList,
      label: "Plans",
      number: plans.length,
      href: "/visits",
      description: "takes you to your list of plans",
      bgColor: "bg-cub-mint",
      iconColor: "text-primary",
    },
    {
      icon: Star,
      label: "Journal",
      number: journalEntriesCount,
      href: "/journal",
      description: "takes you to the journal page",
      bgColor: "bg-cub-teal-light",
      iconColor: "text-primary",
    },
  ];

  // Compute the next upcoming visit
  const nextVisit = useMemo(() => {
    return events
      .filter(ev => new Date(ev.start_time) > new Date()) // only future events
      .sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime() // ascending
      )[0]; // take first
  }, [events]);

  const isLoadingPlans = plansQuery.isLoading;
  const isLoadingVisits = visitsQuery.isLoading;

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-5xl mx-auto space-y-6">


          {/* Dashboard Title Banner */}
          <div className="relative">
            <div className="bg-card rounded-full py-4 px-12 shadow-sm flex items-center justify-center">
              <Bookmark className="absolute left-4 w-6 h-10 text-primary" />
              <h1 className="font-display text-2xl font-bold text-center">Dashboard</h1>
              <Bookmark className="absolute right-4 w-6 h-10 text-primary" />
            </div>
          </div>

          {!isLoadingPlans && plans.length === 0 && (
            <div className="bg-card rounded-3xl p-6 shadow-sm border">
              <h2 className="font-display text-xl font-bold text-primary">Create your first parenting plan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Start here to invite your co-parent and begin tracking visits, messages, and documents.
              </p>
              <div className="mt-4">
                <Button asChild className="rounded-full">
                  <Link to="/create-plan">Create plan</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Quick Action Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <Link
                  key={idx} 
                  to={link.href}
                  role="button" 
                  tabIndex={0} 
                  aria-label={link.label ? `${link.label}: ${link.description}` : link.description} // accessibility
                  className={`group relative ${link.bgColor} rounded-3xl p-6 flex flex-col items-center justify-center aspect-square shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`} // visible focus ring
                >
                  <Icon className={`w-12 h-12 ${link.iconColor} mb-2 transition-transform group-hover:scale-110`} />

                  {link.number !== undefined && (
                    <span className={`text-3xl font-display font-bold ${link.iconColor} transition-opacity group-hover:opacity-20`}>
                      {link.number}
                    </span>
                  )}

                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-center opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                    {link.label && (
                      <p className={`font-display font-bold text-base ${link.iconColor}`}>{link.label}</p>
                    )}
                    <p className={`text-xs mt-1 px-2 ${link.iconColor} opacity-80`}>{link.description}</p>
                  </div>

                  {(isLoadingPlans || isLoadingVisits) && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-3xl">
                      <span className="loader" role="status" aria-live="polite">Loading...</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Next Upcoming Visit */}
            <div className="bg-card rounded-3xl p-6 shadow-sm">
              <h2 className="font-display font-bold text-lg mb-4">Next Upcoming Visit</h2>
              {nextVisit ? (() => {
                const visitDate = DateTime.fromISO(nextVisit.start_time).setZone("local"); // compute once
                return (
                  <p className="text-2xl font-display">
                    {visitDate.toLocaleString(DateTime.DATE_MED)},{" "}
                    {visitDate.toFormat("hh:mm a")}
                  </p>
                );
              })() : (
                <p>No upcoming visits</p>
              )}
            </div>

            {/* Unread Messages / Last Message Preview */}
            <div className="bg-card rounded-3xl p-6 shadow-sm">
              <Link to="/messages">
                <h2 className="font-display font-bold text-lg mb-4">Unread Messages</h2>
                <div className="space-y-3" role="list">
              {unreadMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No unread messages</p>
              ) : (
                <>
                  {unreadMessages.map((msg, idx) => (
                    <div
                      key={`msg-${idx}`}
                      role="listitem"
                      aria-label={`Unread message: ${msg.message}, received at ${msg.time}`}
                      className="flex items-start justify-between border-b border-border pb-3 last:border-0"
                    >
                      <p className="text-foreground/80">{msg.message}</p>
                      <span className="text-sm text-muted-foreground ml-4 flex-shrink-0">
                        {msg.time}
                      </span>
                    </div>
                  ))}
                  {/* Pagination controls */}
                  {unreadMessages.length > messagesPerPage && (
                    <Pagination className="mt-2">
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                      <PaginationNext
                        onClick={() => setCurrentPage(p => p + 1)}
                        className={currentPage === Math.ceil(allUnreadMessages.length / messagesPerPage) ? "pointer-events-none opacity-50" : ""}
                      />
                    </Pagination>
                  )}
                </>
              )}
            </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
