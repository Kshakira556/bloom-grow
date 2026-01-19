export type JournalEntry = {
  id: string;
  child_id: string;
  author_id: string;
  entry_date: string;
  content?: string;
  title?: string;
  mood?: string;
  image?: string | null;
  type: "all" | "received" | "sent";
};
