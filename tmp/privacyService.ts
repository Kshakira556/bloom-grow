import db from "../db/index.ts";

export type PrivacyRequest = {
  id: string;
  user_id: string | null;
  contact_email: string | null;
  request_type: "access" | "correction" | "deletion" | "objection";
  details: string | null;
  status: "open" | "in_progress" | "closed";
  created_at: string;
  updated_at?: string;
};

const ensurePrivacyRequestsTable = async () => {
  await db.queryObject`
    CREATE TABLE IF NOT EXISTS privacy_requests (
      id UUID PRIMARY KEY,
      user_id UUID NULL,
      contact_email TEXT NULL,
      request_type TEXT NOT NULL,
      details TEXT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NULL
    );
  `;
};

export const createPrivacyRequest = async (data: {
  user_id?: string | null;
  contact_email?: string | null;
  request_type: PrivacyRequest["request_type"];
  details?: string | null;
}): Promise<PrivacyRequest> => {
  await ensurePrivacyRequestsTable();
  const id = crypto.randomUUID();
  const result = await db.queryObject<PrivacyRequest>`
    INSERT INTO privacy_requests (id, user_id, contact_email, request_type, details)
    VALUES (
      ${id},
      ${data.user_id ?? null},
      ${data.contact_email ?? null},
      ${data.request_type},
      ${data.details ?? null}
    )
    RETURNING *;
  `;
  if (!result.rows[0]) throw new Error("Failed to create privacy request");
  return result.rows[0];
};

