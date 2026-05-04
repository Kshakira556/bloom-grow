import db from "../db/index.ts";
import { User } from "../types/types.ts";
import { hash, genSalt } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { z } from "npm:zod";

export const CreateUserSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["parent", "mediator", "admin"]).optional(),
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
