export type VisitEvent = { id: number; title: string; day: number; type: "mine" | "theirs" | "deleted"; planId: number };
export type Plan = { id: number; name: string };

export const mockEvents: VisitEvent[] = [
  { id: 1, title: "Pick up Sophie", day: 0, type: "mine", planId: 1 },
  { id: 2, title: "Drop off Sophie", day: 4, type: "theirs", planId: 1 },
  { id: 3, title: "Week with Mom", day: 1, type: "mine", planId: 2 },
  { id: 4, title: "Week with Dad", day: 5, type: "theirs", planId: 2 },
  { id: 5, title: "School Pickup", day: 2, type: "mine", planId: 3 },
];

export const mockPlans: Plan[] = [
  { id: 1, name: "Weekday / Weekend Split" },
  { id: 2, name: "Alternating Weeks" },
  { id: 3, name: "School Term Only" },
];
