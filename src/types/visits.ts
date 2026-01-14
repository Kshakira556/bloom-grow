export type VisitEvent = {
  id: string;
  title: string;               
  day: number;                 
  type: "mine" | "theirs" | "deleted";
  planId: string;
  start_time: string;
  end_time: string;
  location: string;
  status: "scheduled" | "completed" | "cancelled";
};
