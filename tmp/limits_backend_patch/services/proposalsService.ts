import db from "../db/index.ts";
import { z } from "npm:zod";

export type PlanProposal = {
  id: string;
  plan_id: string;
  created_by: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

const CreateProposalSchema = z.object({
  plan_id: z.string(),
  created_by: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
});

const UpdateProposalSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  reviewed_by: z.string().optional(),
});

const ensureProposalsTable = async () => {
  await db.queryObject`
    CREATE TABLE IF NOT EXISTS plan_proposals (
      id UUID PRIMARY KEY,
      plan_id UUID NOT NULL,
      created_by UUID NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP,
      reviewed_by UUID,
      reviewed_at TIMESTAMP
    );
  `;
};

export const listProposals = async (status?: string): Promise<PlanProposal[]> => {
  await ensureProposalsTable();

  if (status) {
    const result = await db.queryObject<PlanProposal>`
      SELECT * FROM plan_proposals
      WHERE status = ${status}
      ORDER BY created_at DESC
    `;
    return result.rows;
  }

  const result = await db.queryObject<PlanProposal>`
    SELECT * FROM plan_proposals
    ORDER BY created_at DESC
  `;
  return result.rows;
};

export const createProposal = async (data: {
  plan_id: string;
  created_by: string;
  title: string;
  description: string;
}): Promise<PlanProposal> => {
  await ensureProposalsTable();

  const proposal = CreateProposalSchema.parse(data);
  const id = crypto.randomUUID();

  const result = await db.queryObject<PlanProposal>`
    INSERT INTO plan_proposals (id, plan_id, created_by, title, description, status)
    VALUES (${id}, ${proposal.plan_id}, ${proposal.created_by}, ${proposal.title}, ${proposal.description}, 'pending')
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Failed to create proposal");
  return result.rows[0];
};

export const updateProposalStatus = async (
  id: string,
  data: { status: "pending" | "approved" | "rejected"; reviewed_by?: string }
): Promise<PlanProposal> => {
  await ensureProposalsTable();

  const update = UpdateProposalSchema.parse(data);
  const reviewedBy = update.reviewed_by ?? null;

  const result = await db.queryObject<PlanProposal>`
    UPDATE plan_proposals
    SET status = ${update.status},
        updated_at = NOW(),
        reviewed_by = ${reviewedBy ? reviewedBy : null}::UUID,
        reviewed_at = ${reviewedBy ? "NOW()" : null}::timestamp
    WHERE id = ${id}
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Proposal not found");
  return result.rows[0];
};

export const deleteProposal = async (id: string): Promise<PlanProposal> => {
  await ensureProposalsTable();
  const result = await db.queryObject<PlanProposal>`
    UPDATE plan_proposals
    SET status = 'deleted', updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  if (!result.rows[0]) throw new Error("Proposal not found");
  return result.rows[0];
};
