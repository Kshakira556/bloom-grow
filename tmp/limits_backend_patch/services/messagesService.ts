import db from "../db/index.ts";
import { z } from "npm:zod";
import type { User } from "../types/types.ts";

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  plan_id: string;
  content: string;
  created_at: string;
  is_flagged: boolean;
  flagged_reason?: string;
  is_deleted: boolean;
   is_seen?: boolean;
  seen_at?: string | null;
};

// Input validation
const SendMessageSchema = z.object({
  sender_id: z.string(),
  receiver_id: z.string(),
  plan_id: z.string(),
  content: z.string().min(1).max(5000),
});

export const sendMessage = async (messageData: {
  sender_id: string;
  receiver_id: string;
  plan_id: string;
  content: string;
}): Promise<Message> => {
  const message = SendMessageSchema.parse(messageData);

  const result = await db.queryObject<Message>`
    INSERT INTO messages (sender_id, receiver_id, plan_id, content)
    VALUES (${message.sender_id}, ${message.receiver_id}, ${message.plan_id}, ${message.content})
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Failed to send message");

  const msg = result.rows[0];

  // Insert history record for original creation
  await db.queryObject`
    INSERT INTO message_history (message_id, sender_id, receiver_id, plan_id, content, action_type, action_by, is_seen, seen_at)
    VALUES (${msg.id}, ${msg.sender_id}, ${msg.receiver_id}, ${msg.plan_id}, ${msg.content}, 'create', ${msg.sender_id}, FALSE, NULL)
  `;

  return msg;
};

export const getMessagesByPlan = async (
  plan_id: string,
  user_id: string,
  includeDeleted = false
): Promise<Message[]> => {
  const query = `
    SELECT *
    FROM messages
    WHERE plan_id = $1
      AND (
        sender_id = $2
        OR receiver_id = $2
      )
      ${includeDeleted ? "" : "AND is_deleted = FALSE"}
    ORDER BY created_at ASC
  `;

  const result = await db.queryObject<Message>({
    text: query,
    args: [plan_id, user_id],
  });

  return result.rows;
};

export const updateMessage = async (
  id: string,
  content: string,
  user_id: string
): Promise<Message> => {
  const result = await db.queryObject<Message>`
    UPDATE messages
    SET content = ${content},
        updated_at = NOW(),
        updated_by = ${user_id},
        is_seen = FALSE,
        seen_at = NULL
    WHERE id = ${id}
    AND sender_id = ${user_id}
    AND is_deleted = FALSE
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Message not found or deleted");

  const msg = result.rows[0];

  // Insert history record
  await db.queryObject`
    INSERT INTO message_history (message_id, sender_id, receiver_id, plan_id, content, action_type, action_by, is_seen, seen_at)
    VALUES (${msg.id}, ${msg.sender_id}, ${msg.receiver_id}, ${msg.plan_id}, ${msg.content}, 'update', ${user_id}, FALSE, NULL)
  `;

  return msg;
};

export const flagMessage = async (
  id: string,
  data: { is_flagged: boolean; flagged_reason?: string },
  user: User
): Promise<Message> => {
  const isMediatorOrAdmin = user.role === "admin" || user.role === "mediator";

  const result = await db.queryObject<Message>`
    UPDATE messages
    SET is_flagged = ${data.is_flagged},
        flagged_reason = ${data.flagged_reason ?? null},
        updated_at = NOW(),
        updated_by = ${user.id}
    WHERE id = ${id}
      AND is_deleted = FALSE
      AND (receiver_id = ${user.id} OR ${isMediatorOrAdmin})
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Message not found or deleted");

  return result.rows[0];
};

export const deleteMessage = async (id: string, user_id: string): Promise<Message> => {
  const result = await db.queryObject<Message>`
    UPDATE messages
    SET is_deleted = TRUE, deleted_by = ${user_id}, updated_at = NOW()
    WHERE id = ${id}
    AND sender_id = ${user_id}
    AND is_deleted = FALSE
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Message not found or already deleted");

  const msg = result.rows[0];

  // Insert history record
  await db.queryObject`
    INSERT INTO message_history (message_id, sender_id, receiver_id, plan_id, content, action_type, action_by, deleted_by, is_seen, seen_at)
    VALUES (${msg.id}, ${msg.sender_id}, ${msg.receiver_id}, ${msg.plan_id}, ${msg.content}, 'delete', ${user_id}, ${user_id}, FALSE, NULL)
  `;

  return msg;
};

export const getMessageHistory = async (message_id: string) => {
  const result = await db.queryObject`
    SELECT * FROM message_history
    WHERE message_id = ${message_id}
    ORDER BY action_at ASC
  `;
  return result.rows;
};

export const markMessageAsSeen = async (message_id: string, user_id: string): Promise<Message> => {
  // Only receiver can mark as seen
  const result = await db.queryObject<Message>`
    UPDATE messages
    SET is_seen = TRUE,
        seen_at = NOW()
    WHERE id = ${message_id} AND receiver_id = ${user_id} AND is_seen = FALSE
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Message not found or already seen");

  const msg = result.rows[0];

  await db.queryObject`
    INSERT INTO message_history (message_id, sender_id, receiver_id, plan_id, content, action_type, action_by, is_seen, seen_at)
    VALUES (${msg.id}, ${msg.sender_id}, ${msg.receiver_id}, ${msg.plan_id}, ${msg.content}, 'seen', ${user_id}, TRUE, ${msg.seen_at})
  `;

  return msg;
};

