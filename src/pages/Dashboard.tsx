import { Navbar } from "@/components/layout/Navbar";
import { Link } from "react-router-dom";
import { Lock, Car, ClipboardList, Star, Bookmark } from "lucide-react";
import * as api from "@/lib/api";
import { useEffect, useState } from "react";
import type { VisitEvent } from "@/types/visits";
import { mapVisitsToEvents } from "@/lib/mappers/visitMapper";

const unreadMessages = [
  {
    message: "Please remember to fetch her from school today",
    time: "12:02",
    href: "/messages",
    description: "Unread Messages"
  },
  {
    message: "I found her forms in the cupboard",
    time: "12:00",
    href: "/messages",
    description: "Unread Messages"
  },
];

export default function Dashboard() {
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [activePlan, setActivePlan] = useState<api.FullPlan | null>(null);
  const [events, setEvents] = useState<VisitEvent[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
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
        alert("Unable to load plans. Please refresh or login again.");
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchVisits = async () => {
      if (!activePlan) {
        setEvents([]);
        return;
      }

      try {
        const { data } = await api.getVisitsByPlan(activePlan.id);
        setEvents(mapVisitsToEvents(data));
      } catch (err) {
        console.error("Failed to load visits:", err);
      }
    };

    fetchVisits();
  }, [activePlan]);

  const journalEntriesCount = 0; 
  const remainingVisitsCount = events.length;

  const quickLinks = [
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
      number: remainingVisitsCount,
      href: "/visits",
      description: "takes you to the visits page",
      bgColor: "bg-cub-green",
      iconColor: "text-primary-foreground",
    },
    {
      icon: ClipboardList,
      number: plans.length,
      href: "/visits",
      description: "takes you to your list of plans",
      bgColor: "bg-cub-mint",
      iconColor: "text-primary",
    },
    {
      icon: Star,
      number: journalEntriesCount,
      href: "/journal",
      description: "takes you to the journal page",
      bgColor: "bg-cub-teal-light",
      iconColor: "text-primary",
    },
  ];

  // Compute the next upcoming visit
  const nextVisit = events
    .filter(ev => new Date(ev.start_time) > new Date()) // only future events
    .sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime() // ascending
    )[0]; // take first

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
            {quickLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <Link
                  key={`quicklink-${idx}`} // unique key per item
                  to={link.href}
                  className={`group relative ${link.bgColor} rounded-3xl p-6 flex flex-col items-center justify-center aspect-square shadow-sm transition-all`}
                >
                  <Icon
                    className={`w-12 h-12 ${link.iconColor} mb-2 transition-transform group-hover:scale-110`}
                  />

                  {link.number !== undefined && (
                    <span
                      className={`text-3xl font-display font-bold ${link.iconColor} transition-opacity group-hover:opacity-20`}
                    >
                      {link.number}
                    </span>
                  )}

                  {/* Hover Label moved down towards bottom */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-center opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                    {link.label && (
                      <p className="font-display font-bold text-base text-primary-foreground">
                        {link.label}
                      </p>
                    )}
                    <p className="text-xs text-primary-foreground/80 mt-1 px-2">
                      {link.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Next Upcoming Visit */}
            <div className="bg-card rounded-3xl p-6 shadow-sm">
              <h2 className="font-display font-bold text-lg mb-4">Next Upcoming Visit</h2>
              {nextVisit ? (
                <p className="text-2xl font-display">
                  {new Date(nextVisit.start_time).toLocaleDateString()},{" "}
                  {new Date(nextVisit.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : (
                <p>No upcoming visits</p>
              )}
            </div>

            {/* Unread Messages / Last Message Preview */}
            <div className="bg-card rounded-3xl p-6 shadow-sm">
              <Link to="/messages">
              <h2 className="font-display font-bold text-lg mb-4">Unread Messages</h2>
              <div className="space-y-3">
                {unreadMessages.map((msg, idx) => (
                  <div key={`msg-${idx}`} className="flex items-start justify-between border-b border-border pb-3 last:border-0">
                    <p className="text-foreground/80">{msg.message}</p>
                    <span className="text-sm text-muted-foreground ml-4 flex-shrink-0">{msg.time}</span>
                  </div>
                ))}
              </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
