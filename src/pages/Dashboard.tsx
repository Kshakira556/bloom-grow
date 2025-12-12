import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  BookOpen,
  Lock,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react";

const quickLinks = [
  {
    icon: Lock,
    label: "Vault",
    description: "Access child info",
    href: "/children",
    color: "bg-cub-sky-light",
    iconColor: "text-cub-sky",
  },
  {
    icon: Calendar,
    label: "Visits",
    description: "View schedule",
    href: "/visits",
    color: "bg-cub-sage-light",
    iconColor: "text-primary",
  },
  {
    icon: Users,
    label: "Plans",
    description: "Manage plans",
    href: "/visits",
    color: "bg-cub-honey-light",
    iconColor: "text-cub-honey",
  },
  {
    icon: BookOpen,
    label: "Journal",
    description: "Write entries",
    href: "/journal",
    color: "bg-cub-lavender-light",
    iconColor: "text-cub-lavender",
  },
];

const unreadMessages = [
  {
    from: "Sophie",
    message: "Please remember to fetch her from school today",
    time: "12:02",
  },
  {
    from: "Sophie",
    message: "I found her forms in the cupboard",
    time: "12:00",
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-cub-sage-light via-cub-cream to-cub-honey-light rounded-3xl p-8 border border-border/50">
          <h2 className="font-display font-bold text-2xl mb-2">
            Welcome back, John! 👋
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your family today.
          </p>
        </div>

        {/* Stats & Quick Links */}
        <div className="grid md:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.label} to={link.href}>
                <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div
                      className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center mb-4`}
                    >
                      <Icon className={`w-6 h-6 ${link.iconColor}`} />
                    </div>
                    <h3 className="font-display font-bold">{link.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Next Upcoming Visit */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Next Upcoming Visit
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/visits">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-cub-sage-light rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary rounded-xl flex flex-col items-center justify-center text-primary-foreground">
                    <span className="text-lg font-bold">17</span>
                    <span className="text-xs">Nov</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display font-bold text-lg">
                      Pick up Sophie
                    </h4>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      13:00 - Sophie
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please remember to fetch her from school today
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unread Messages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cub-coral" />
                Unread Messages
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/messages">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {unreadMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-cub-coral-light rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-bold text-cub-coral text-sm">
                      {msg.from[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{msg.from}</span>
                      <span className="text-xs text-muted-foreground">
                        {msg.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
