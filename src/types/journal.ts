// src/types/journal.ts

export type JournalEntry = {
  title?: string;
  text: string;
  mood: string;
  image: string | null;
  type: "all" | "received" | "sent";
};

export const mockJournalEntries: JournalEntry[] = [
  { title: "Morning", text: "Morning walk with the dog", mood: "😊", image: null, type: "all" },
  { title: "Postcard", text: "Sent a postcard to Grandma", mood: "🥰", image: null, type: "all" },
  { title: "Book Reading", text: "Read a book", mood: "😴", image: null, type: "received" },
  { title: "Notes with friends", text: "Shared notes with friend", mood: "😢", image: null, type: "sent" },
];
