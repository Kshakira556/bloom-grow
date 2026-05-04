import db from "../db/index.ts";
import { z } from "npm:zod";
import { canUserAccessChildViaFamily } from "./familyService.ts";
export type JournalEntry = {
  id: string;
  child_id: string;
  plan_id?: string;
  author_id: string;
  entry_date: string; 
  content?: string;
  title?: string;
  mood?: string;
  image?: string;
  created_at: string;
  updated_at?: string;
};

// Input validation
const CreateJournalEntrySchema = z.object({
  child_id: z.string(),
  plan_id: z.string().optional(),
  author_id: z.string(),
  entry_date: z.string().optional().default(() => new Date().toISOString()), 
  content: z.string().max(20000).optional(),
  title: z.string().max(200).optional(),
  mood: z.string().max(50).optional(),
  image: z.string().optional(),
});

export const createJournalEntry = async (entryData: {
  child_id: string;
  plan_id?: string;
  author_id: string;
  entry_date?: string;
  content?: string;
  title?: string;
  mood?: string;
  image?: string;
}): Promise<JournalEntry> => {
  const entry = CreateJournalEntrySchema.parse(entryData);

  const result = await db.queryObject<JournalEntry>`
    INSERT INTO child_journal (child_id, plan_id, author_id, entry_date, content, title, mood, image)
    VALUES (${entry.child_id}, ${entry.plan_id}, ${entry.author_id}, ${entry.entry_date}, ${entry.content}, ${entry.title}, ${entry.mood}, ${entry.image})
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Failed to create journal entry");

  return result.rows[0];
};

export const getJournalByChild = async (child_id: string): Promise<JournalEntry[]> => {
  const result = await db.queryObject<JournalEntry>`
    SELECT * FROM child_journal
    WHERE child_id = ${child_id}
      AND deleted_at IS NULL
    ORDER BY entry_date DESC
  `;
  return result.rows;
};

export const getJournalEntryById = async (id: string): Promise<JournalEntry | null> => {
  const result = await db.queryObject<JournalEntry>`
    SELECT * FROM child_journal
    WHERE id = ${id}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return result.rows[0] ?? null;
};

export const canUserAccessChild = async (
  user_id: string,
  child_id: string,
): Promise<boolean> => {
  const familyAccess = await canUserAccessChildViaFamily(user_id, child_id);
  if (familyAccess) {
    return true;
  }

  const result = await db.queryObject<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM user_children
    WHERE user_id = ${user_id}
      AND child_id = ${child_id};
  `;

  return Number(result.rows[0]?.count ?? 0) > 0;
};

export const updateJournalEntry = async (
  id: string,
  data: Partial<{ entry_date: string; content: string; title: string; mood: string; image: string }>
): Promise<JournalEntry> => {
  if (typeof data.content === "string" && data.content.length > 20000) {
    throw new Error("Content too long (max 20000 characters)");
  }
  if (typeof data.title === "string" && data.title.length > 200) {
    throw new Error("Title too long (max 200 characters)");
  }
  if (typeof data.mood === "string" && data.mood.length > 50) {
    throw new Error("Mood too long (max 50 characters)");
  }

  const result = await db.queryObject<JournalEntry>`
    UPDATE child_journal
    SET entry_date = COALESCE(${data.entry_date}, entry_date),
        content = COALESCE(${data.content}, content),
        title = COALESCE(${data.title}, title),
        mood = COALESCE(${data.mood}, mood),
        image = COALESCE(${data.image}, image),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Journal entry not found");

  return result.rows[0];
};

export const deleteJournalEntry = async (id: string): Promise<JournalEntry> => {
  const result = await db.queryObject<JournalEntry>`
    UPDATE child_journal
    SET deleted_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Journal entry not found");

  return result.rows[0];
};
