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

export default function Dashboard() {
  const { toast } = useToast(); 
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);
  const [events, setEvents] = useState<VisitEvent[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<
    { message: string; time: string; href: string; description: string }[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 5; 
  const [isLoadingPlans, setIsLoadingPlans] = useState(false); 
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [allUnreadMessages, setAllUnreadMessages] = useState<
    { message: string; created_at: string }[]
  >([]);

  useEffect(() => {
    const fetchUnreadMessages = async (retry = 0) => {
      if (!activePlan) {
        setUnreadMessages([]);
        return;
      }

      try {
        const messages = await api.getMessagesByPlan(activePlan.id);

        const unreadAll = messages
          .filter(msg => !msg.is_seen)
          .sort((a,b) => DateTime.fromISO(b.created_at).toMillis() - DateTime.fromISO(a.created_at).toMillis());

        setAllUnreadMessages(
          unreadAll.map(msg => ({
            message: msg.content,
            created_at: msg.created_at,
          }))
        ); 

        const startIdx = (currentPage - 1) * messagesPerPage;
        const pagedUnread = unreadAll
          .slice(startIdx, startIdx + messagesPerPage)
          .map(msg => {
            const msgTime = DateTime.fromISO(msg.created_at).setZone("local");
            return {
              message: msg.content,
              time: msgTime.toFormat("hh:mm a"),
              href: "/messages",
              description: "Unread Messages",
            };
          });

        setUnreadMessages(pagedUnread);
      } catch (err) {
        console.error("Failed to fetch unread messages:", err);

        toast({
          title: "Failed to load messages",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
          action: retry < 3 ? (
            <ToastAction
              onClick={() => fetchUnreadMessages(retry + 1)}
              altText="Retry fetching messages"
            >
              Retry
            </ToastAction>
          ) : undefined,
        });
        setUnreadMessages([]);
      }
    };

    setCurrentPage(1)
    fetchUnreadMessages();
  }, [activePlan, toast, currentPage]);

  useEffect(() => {
    const fetchPlans = async (retry = 0) => {
      setIsLoadingPlans(true);
      try {
        const { plans } = await api.getPlans();
        setPlans(plans);

        if (plans[0]) {
          const { plan: fullPlan } = await api.getPlanById(plans[0].id);
          setActivePlan(fullPlan);
        } else {
          setActivePlan(null);
        }
      } catch (err) {
        console.error("Failed to load plans:", err);

        toast({
          title: "Failed to load plans",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
          action: retry < 3 ? (
            <ToastAction
              onClick={() => fetchPlans(retry + 1)}
              altText="Retry fetching plans"
            >
              Retry
            </ToastAction>
          ) : undefined,
        });
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [toast]);

  useEffect(() => {
  const fetchVisits = async (retry = 0) => {
    if (!activePlan) {
      setEvents([]);
      return;
    }

    setIsLoadingVisits(true);
    try {
      const { data } = await api.getVisitsByPlan(activePlan.id);
      setEvents(mapVisitsToEvents(data));
    } catch (err) {
      console.error("Failed to load visits:", err);

      toast({
        title: "Failed to load visits",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
        action: retry < 3 ? (
          <ToastAction
            onClick={() => fetchVisits(retry + 1)}
            altText="Retry fetching visits"
          >
            Retry
          </ToastAction>
        ) : undefined,
      });
    } finally {
      setIsLoadingVisits(false);
    }
  };

  fetchVisits();
}, [activePlan, toast]);

  const journalEntriesCount = 0; 
  const remainingVisitsCount = events.length;

  // Precompute numbers
const quickLinksData = [
  {
    icon: Lock,
    label: "Vault",
    href: "/children",
    description: "takes you to the vault of child info",
    bgColor: "bg-primary",
    iconColor: "text-primary-foreground",
  },
  {
    icon: Car,
    number: remainingVisitsCount, // precomputed
    label: "Visits",
    href: "/visits",
    description: "takes you to the visits page",
    bgColor: "bg-cub-green",
    iconColor: "text-primary-foreground",
  },
  {
    icon: ClipboardList,
    number: plans.length, // precomputed
    label: "Plans",
    href: "/visits",
    description: "takes you to your list of plans",
    bgColor: "bg-cub-mint",
    iconColor: "text-primary",
  },
  {
    icon: Star,
    number: journalEntriesCount, // precomputed
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

          {/* Quick Action Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinksData.map((link) => {
  const Icon = link.icon;
  return (
    <Link
      key={`${link.href}-${link.label}`} 
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
          <p className="font-display font-bold text-base text-primary-foreground">{link.label}</p>
        )}
        <p className="text-xs text-primary-foreground/80 mt-1 px-2">{link.description}</p>
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
