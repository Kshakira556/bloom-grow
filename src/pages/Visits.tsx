import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { useState } from "react";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const mockEvents = [
  {
    id: 1,
    title: "Pick up from school",
    date: "2024-01-15",
    time: "3:30 PM",
    location: "Lincoln Elementary",
    type: "mine",
  },
  {
    id: 2,
    title: "Soccer Practice",
    date: "2024-01-16",
    time: "4:00 PM",
    location: "City Park Field",
    type: "mine",
  },
  {
    id: 3,
    title: "Weekend with Dad",
    date: "2024-01-19",
    time: "9:00 AM",
    location: "Home",
    type: "theirs",
  },
  {
    id: 4,
    title: "Doctor Appointment",
    date: "2024-01-22",
    time: "10:00 AM",
    location: "Pediatric Center",
    type: "mine",
  },
];

const upcomingVisits = [
  {
    id: 1,
    child: "Emma",
    with: "Dad",
    date: "Jan 19-21",
    status: "confirmed",
  },
  {
    id: 2,
    child: "Liam",
    with: "Mom",
    date: "Jan 25-28",
    status: "pending",
  },
  {
    id: 3,
    child: "Emma & Liam",
    with: "Dad",
    date: "Feb 2-4",
    status: "confirmed",
  },
];

const Visits = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <DashboardLayout>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Custody Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-display font-bold min-w-[140px] text-center">
                  {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {[...Array(firstDay)].map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate() && 
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();
                  const isSelected = day === selectedDate;
                  const hasMyEvent = day % 5 === 0;
                  const hasTheirEvent = day % 7 === 0;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all
                        ${isToday ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}
                        ${isSelected && !isToday ? "ring-2 ring-primary" : ""}
                      `}
                    >
                      <span className="text-sm font-medium">{day}</span>
                      {(hasMyEvent || hasTheirEvent) && (
                        <div className="flex gap-1">
                          {hasMyEvent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cub-sage" />
                          )}
                          {hasTheirEvent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cub-coral" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-6 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cub-sage" />
                  <span className="text-sm text-muted-foreground">Your time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cub-coral" />
                  <span className="text-sm text-muted-foreground">Co-parent's time</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Events</CardTitle>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors hover:bg-secondary/50 ${
                      event.type === "mine" ? "border-l-4 border-l-cub-sage" : "border-l-4 border-l-cub-coral"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      event.type === "mine" ? "bg-cub-sage-light" : "bg-cub-coral-light"
                    }`}>
                      <Calendar className={`w-5 h-5 ${
                        event.type === "mine" ? "text-cub-sage" : "text-cub-coral"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display font-bold">{event.title}</h4>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.date} at {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Visits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Upcoming Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingVisits.map((visit) => (
                  <div key={visit.id} className="p-4 bg-secondary/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-bold">{visit.child}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        visit.status === "confirmed" 
                          ? "bg-cub-sage-light text-cub-sage" 
                          : "bg-cub-honey-light text-cub-honey"
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      With {visit.with} • {visit.date}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Plus className="w-4 h-4" />
                  Request Schedule Change
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  Propose Holiday Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Visits;
