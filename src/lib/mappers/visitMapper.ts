import type { ApiVisit } from "@/lib/api";
import type { VisitEvent } from "@/types/visits";

export const mapVisitsToEvents = (visits: ApiVisit[]): VisitEvent[] => {
  return visits.map((v) => ({
    id: v.id,
    title: v.notes || "Visit",
    type: "mine", // temporary until API provides ownership
    planId: v.plan_id,
    start_time: v.start_time,
    end_time: v.end_time,
    location: v.location || "",
    status: v.status || "scheduled",
    day: (new Date(v.start_time).getDay() + 6) % 7, // Monday = 0
  }));
};
