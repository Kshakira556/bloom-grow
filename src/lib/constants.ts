// Shared constants for the app
export type MessagePurpose =
  | "General"
  | "Legal"
  | "Medical"
  | "Safety"
  | "Emergency"
  | "Financial";

// PURPOSES list used in filters and UI
export const PURPOSES: Array<MessagePurpose | "All"> = [
  "All",
  "General",
  "Legal",
  "Medical",
  "Safety",
  "Emergency",
  "Financial",
];
