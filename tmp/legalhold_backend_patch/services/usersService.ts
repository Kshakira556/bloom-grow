import db from "../db/index.ts";
import { User } from "../types/types.ts";
import { hash, genSalt } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { z } from "npm:zod";

export const CreateUserSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["parent", "mediator", "admin", "cub_internal"]).optional(),
  phone: z.string().optional(),

  account_type: z.enum(["trial", "paid"]).optional(),

  // Terms / Privacy acceptance captured at registration time (frontend enforced)
  terms_accepted: z.boolean().optional(),
  terms_version: z.string().optional(),
  privacy_version: z.string().optional(),
  terms_accepted_at: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const createUser = async ({
  full_name,
  email,
  password,
  role = "parent",
  phone,
  account_type = "trial",
  terms_accepted,
  terms_version,
  privacy_version,
  terms_accepted_at,
}: CreateUserInput & { account_type?: "trial" | "paid" }): Promise<User> => {
  const salt = await genSalt(10);
  const password_hash = await hash(password, salt);

  // ---------------------------------------------
  // TRIAL LOGIC
  // ---------------------------------------------
  // ---------------------------------------------
  const now = new Date();

  const trial_ends_at =
    account_type === "trial"
      ? new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // +2 days
      : null;

  const subscription_status =
    account_type === "paid" ? "active" : "trial";

  let result;

  // Try insert with terms/privacy acceptance columns; fall back if DB not migrated yet.
  try {
    result = await db.queryObject<User>`
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        phone,
        account_type,
        trial_ends_at,
        subscription_status,
        terms_accepted,
        terms_version,
        privacy_version,
        terms_accepted_at
      )
      VALUES (
        ${full_name},
        ${email},
        ${password_hash},
        ${role},
        ${phone},
        ${account_type},
        ${trial_ends_at},
        ${subscription_status},
        ${terms_accepted ?? false},
        ${terms_version ?? null},
        ${privacy_version ?? null},
        ${terms_accepted_at ? new Date(terms_accepted_at) : null}
      )
      RETURNING *;
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const missingTermsColumns =
      message.includes("terms_accepted") ||
      message.includes("terms_version") ||
      message.includes("privacy_version") ||
      message.includes("terms_accepted_at");

    if (!missingTermsColumns) {
      throw error;
    }

    result = await db.queryObject<User>`
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        phone,
        account_type,
        trial_ends_at,
        subscription_status
      )
      VALUES (
        ${full_name},
        ${email},
        ${password_hash},
        ${role},
        ${phone},
        ${account_type},
        ${trial_ends_at},
        ${subscription_status}
      )
      RETURNING *;
    `;
  }

  if (!result.rows[0]) throw new Error("Failed to create user");

  return result.rows[0];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await db.queryObject<User>`
    SELECT * FROM users WHERE LOWER(email) = LOWER(${email.trim()});
  `;
  return result.rows[0] || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const result = await db.queryObject<User>`
    SELECT * FROM users WHERE id = ${id};
  `;
  return result.rows[0] || null;
};

export const listUsers = async (): Promise<User[]> => {
  const result = await db.queryObject<User>`SELECT * FROM users;`;

  return result.rows.map((user) => {
    const createdAt = user.created_at ? new Date(user.created_at) : null;

    return {
      ...user,
      trial_ends_at:
        user.account_type === "trial" &&
        !user.trial_ends_at &&
        createdAt
          ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000)
          : user.trial_ends_at,
    };
  });
};

// --------------------
// POPIA: Account deletion lifecycle
// --------------------

export const requestAccountDeletion = async (args: {
  userId: string;
  reason?: string;
}): Promise<{ request_id: string; scheduled_for: Date | null }> => {
  const now = new Date();
  const scheduledFor = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days grace

  // 1) Mark user for deletion (soft-delete lifecycle).
  const updated = await db.queryObject<{ id: string; deletion_scheduled_for: Date | null }>`
    UPDATE users
    SET
      deletion_requested_at = ${now},
      deletion_scheduled_for = ${scheduledFor}
    WHERE id = ${args.userId}
      AND deleted_at IS NULL
    RETURNING id, deletion_scheduled_for;
  `;

  if (!updated.rows[0]) {
    throw new Error("User not found or already deleted");
  }

  // 2) Record request for auditability (table must exist via migration).
  const inserted = await db.queryObject<{ id: string; scheduled_for: Date | null }>`
    INSERT INTO account_deletion_requests (
      user_id,
      requested_at,
      scheduled_for,
      status,
      reason
    )
    VALUES (
      ${args.userId},
      ${now},
      ${scheduledFor},
      'pending',
      ${args.reason ?? null}
    )
    RETURNING id, scheduled_for;
  `;

  return {
    request_id: inserted.rows[0]?.id ?? "",
    scheduled_for: inserted.rows[0]?.scheduled_for ?? null,
  };
};

export const processDueAccountDeletions = async (args?: {
  limit?: number;
}): Promise<{ processed: number }> => {
  const limit = Math.max(1, Math.min(200, args?.limit ?? 50));
  const now = new Date();

  // Find due users that have not been anonymised/deleted yet.
  const due = await db.queryObject<{
    id: string;
    email: string;
  }>`
    SELECT id, email
    FROM users
    WHERE deleted_at IS NULL
      AND deletion_requested_at IS NOT NULL
      AND deletion_scheduled_for IS NOT NULL
      AND deletion_scheduled_for <= ${now}
      AND COALESCE(legal_hold, FALSE) = FALSE
    ORDER BY deletion_scheduled_for ASC
    LIMIT ${limit};
  `;

  for (const u of due.rows) {
    // "Hard delete" in a relational system: permanently remove/purge personal profile data
    // while preserving the record for co-parent audit trail and referential integrity.
    const replacementEmail = `deleted+${u.id}@cubapp.invalid`;

    await db.queryObject`
      UPDATE users
      SET
        full_name = 'Deleted User',
        email = ${replacementEmail},
        phone = NULL,
        password_hash = '',
        terms_accepted = false,
        terms_version = NULL,
        privacy_version = NULL,
        terms_accepted_at = NULL,
        anonymized_at = ${now},
        deleted_at = ${now}
      WHERE id = ${u.id}
        AND deleted_at IS NULL;
    `;

    await db.queryObject`
      UPDATE account_deletion_requests
      SET status = 'processed', processed_at = ${now}
      WHERE user_id = ${u.id} AND status = 'pending';
    `;
  }

  return { processed: due.rows.length };
};
