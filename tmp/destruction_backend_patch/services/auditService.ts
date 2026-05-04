import db from "../db/index.ts";

export type AuditLog = {
  id: string;
  actor_id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  notes?: string | null;
  created_at: string;
};

const ensureAuditLogsTable = async () => {
  await db.queryObject`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY,
      actor_id UUID NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id UUID,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
};

export const listAuditLogs = async (): Promise<AuditLog[]> => {
  await ensureAuditLogsTable();
  const result = await db.queryObject<AuditLog>`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
  `;
  return result.rows;
};

export const createAuditLog = async (data: {
  actor_id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  notes?: string | null;
}): Promise<AuditLog> => {
  await ensureAuditLogsTable();
  const id = crypto.randomUUID();
  const result = await db.queryObject<AuditLog>`
    INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, notes)
    VALUES (${id}, ${data.actor_id}, ${data.action}, ${data.target_type ?? null}, ${data.target_id ?? null}, ${data.notes ?? null})
    RETURNING *;
  `;
  if (!result.rows[0]) throw new Error("Failed to create audit log");
  return result.rows[0];
};
