import db from "../db/index.ts";
import { z } from "npm:zod";
import {
  ensureFamilyChild,
  ensureFamilyForPlan,
  ensureFamilyMember,
  setInviteFamilyIdIfPossible,
} from "./familyService.ts";

export type ParentingPlan = {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: "active" | "draft" | "archived";
  created_by: string;
  created_at: string;
  updated_at?: string;

  destruction_requested_at?: string | null;
  destruction_due_at?: string | null;
  redacted_at?: string | null;
  legal_hold?: boolean | null;
  destruction_status?: string | null;
};

export const CreatePlanSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  created_by: z.string(),
});

export const createPlan = async (planData: {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "draft" | "archived";
  created_by: string;
}): Promise<ParentingPlan> => {
  const plan = CreatePlanSchema.parse(planData);
  const result = await db.queryObject<ParentingPlan>`
    INSERT INTO parenting_plans 
      (title, description, start_date, end_date, status, created_by, created_at)
    VALUES 
      (${plan.title},
       ${plan.description},
       ${plan.start_date},
       ${plan.end_date},
       ${plan.status ?? "active"},
       ${plan.created_by},
       NOW())
    RETURNING *;
  `;

  if (!result.rows[0]) throw new Error("Failed to create plan");

  await db.queryObject`
    INSERT INTO plan_participants (plan_id, user_id)
    VALUES (${result.rows[0].id}, ${plan.created_by});
  `;

  await ensureFamilyMember(result.rows[0].id, plan.created_by, "parent", {
    familyName: plan.title,
    createdBy: plan.created_by,
  });

  return result.rows[0];
};

export const listPlans = async (): Promise<ParentingPlan[]> => {
  const result = await db.queryObject<ParentingPlan>`
    SELECT * FROM parenting_plans
    ORDER BY created_at DESC
  `;
  return result.rows;
};

// --------------------
// Plan destruction (redaction) requests
// --------------------

const ensurePlanDestructionRequestsTable = async () => {
  await db.queryObject`
    CREATE TABLE IF NOT EXISTS plan_destruction_requests (
      plan_id UUID NOT NULL REFERENCES parenting_plans(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (plan_id, user_id)
    );
  `;

  await db.queryObject`
    CREATE INDEX IF NOT EXISTS idx_plan_destruction_requests_plan_id
    ON plan_destruction_requests(plan_id);
  `;
};

export const requestPlanDestruction = async (args: {
  planId: string;
  userId: string;
}): Promise<{ status: "pending_other_guardian" | "pending_destruction"; destruction_due_at?: string | null }> => {
  await ensurePlanDestructionRequestsTable();

  // Ensure user is a participant on this plan.
  const allowedRes = await db.queryObject<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM plan_participants
    WHERE plan_id = ${args.planId}
      AND user_id = ${args.userId};
  `;
  if (Number(allowedRes.rows[0]?.count ?? 0) <= 0) {
    throw new Error("Access denied");
  }

  // Record this user's destruction request (idempotent).
  await db.queryObject`
    INSERT INTO plan_destruction_requests (plan_id, user_id)
    VALUES (${args.planId}, ${args.userId})
    ON CONFLICT (plan_id, user_id) DO NOTHING;
  `;

  // Count parent participants and how many have requested destruction.
  const parentCountRes = await db.queryObject<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM plan_participants pp
    JOIN users u ON u.id = pp.user_id
    WHERE pp.plan_id = ${args.planId}
      AND u.role = 'parent';
  `;

  const requestedCountRes = await db.queryObject<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM plan_destruction_requests
    WHERE plan_id = ${args.planId};
  `;

  const parentCount = Number(parentCountRes.rows[0]?.count ?? 0);
  const requestedCount = Number(requestedCountRes.rows[0]?.count ?? 0);

  if (parentCount > 0 && requestedCount >= parentCount) {
    // Start the 18-month clock only once.
    const started = await db.queryObject<{ destruction_due_at: string | null }>`
      UPDATE parenting_plans
      SET
        destruction_requested_at = COALESCE(destruction_requested_at, NOW()),
        destruction_due_at = COALESCE(destruction_due_at, NOW() + INTERVAL '18 months'),
        destruction_status = COALESCE(destruction_status, 'pending_destruction'),
        status = CASE WHEN status = 'archived' THEN status ELSE 'archived' END
      WHERE id = ${args.planId}
      RETURNING destruction_due_at;
    `;

    return {
      status: "pending_destruction",
      destruction_due_at: started.rows[0]?.destruction_due_at ?? null,
    };
  }

  return { status: "pending_other_guardian" };
};

export const getPlanWithInvites = async (id: string): Promise<ParentingPlan & { invites: PlanInvite[] } | null> => {
  const result = await db.queryObject<ParentingPlan>`
    SELECT * FROM parenting_plans WHERE id = ${id}
  `;
  const plan = result.rows[0];
  if (!plan) return null;

  const invitesResult = await db.queryObject<PlanInvite>`
    SELECT * FROM plan_invites WHERE plan_id = ${id}
  `;

  return { ...plan, invites: invitesResult.rows };
};

export type PlanInvite = {
  id: string;
  plan_id: string;
  family_id?: string | null;
  invite_token?: string | null;
  email: string;
  status: "pending" | "accepted";
  created_at: string;
};

export const createPlanInvite = async (
  plan_id: string, 
  email: string
): Promise<PlanInvite> => {

  const inviteId = crypto.randomUUID();
  const inviteToken = crypto.randomUUID();

  let result;

  // Prefer inserting invite_token (newer schema); fall back if column not present yet.
  try {
    result = await db.queryObject<PlanInvite>`
      INSERT INTO plan_invites 
        (id, plan_id, invite_token, email, status, created_at)
      VALUES 
        (${inviteId}, ${plan_id}, ${inviteToken}, ${email}, 'pending', NOW())
      RETURNING *;
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("invite_token")) {
      throw error;
    }

    result = await db.queryObject<PlanInvite>`
      INSERT INTO plan_invites 
        (id, plan_id, email, status, created_at)
      VALUES 
        (${inviteId}, ${plan_id}, ${email}, 'pending', NOW())
      RETURNING *;
    `;
  }

  if (!result.rows[0]) throw new Error("Failed to create invite");

  await ensureFamilyForPlan(plan_id);
  await setInviteFamilyIdIfPossible(result.rows[0].id, plan_id);

  return result.rows[0];
};

export const acceptPlanInvite = async (
  inviteId: string,
  userId: string,
  userEmail: string
): Promise<PlanInvite> => {
  const invite = await getInviteById(inviteId);

  if (!invite) throw new Error("Invite not found");

  if (invite.email.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
    throw new Error("This invite was not sent to your email");
  }

  const countResult = await db.queryObject<{ count: number }>`
    SELECT COUNT(*) FROM plan_participants
    WHERE plan_id = ${invite.plan_id};
  `;

  const existingParticipantResult = await db.queryObject<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM plan_participants
    WHERE plan_id = ${invite.plan_id}
      AND user_id = ${userId};
  `;

  const isAlreadyParticipant = Number(existingParticipantResult.rows[0]?.count ?? 0) > 0;

  if (!isAlreadyParticipant && Number(countResult.rows[0].count) >= 2) {
    throw new Error("This plan already has 2 parents");
  }

  if (!isAlreadyParticipant) {
    await db.queryObject`
      INSERT INTO plan_participants (plan_id, user_id)
      VALUES (${invite.plan_id}, ${userId});
    `;
  }

  const result = await db.queryObject<PlanInvite>`
    UPDATE plan_invites
    SET status = 'accepted'
    WHERE id = ${inviteId}
    RETURNING *;
  `;

  await ensureFamilyMember(invite.plan_id, userId, "parent");
  await setInviteFamilyIdIfPossible(inviteId, invite.plan_id);

  try {
    await db.queryObject`
      INSERT INTO user_children (user_id, child_id)
      SELECT DISTINCT ${userId}, pc.child_id
      FROM plan_children pc
      WHERE pc.plan_id = ${invite.plan_id}
        AND NOT EXISTS (
          SELECT 1
          FROM user_children uc
          WHERE uc.user_id = ${userId}
            AND uc.child_id = pc.child_id
        );
    `;

    const planChildIds = await db.queryObject<{ child_id: string }>`
      SELECT DISTINCT pc.child_id
      FROM plan_children pc
      WHERE pc.plan_id = ${invite.plan_id};
    `;

    for (const row of planChildIds.rows) {
      await ensureFamilyChild(invite.plan_id, row.child_id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("plan_children")) {
      throw error;
    }
  }

  await db.queryObject`
    INSERT INTO user_children (user_id, child_id)
    SELECT DISTINCT ${userId}, v.child_id
    FROM visits v
    WHERE v.plan_id = ${invite.plan_id}
      AND NOT EXISTS (
        SELECT 1
        FROM user_children uc
        WHERE uc.user_id = ${userId}
          AND uc.child_id = v.child_id
    );
  `;

  const visitChildIds = await db.queryObject<{ child_id: string }>`
    SELECT DISTINCT v.child_id
    FROM visits v
    WHERE v.plan_id = ${invite.plan_id};
  `;

  for (const row of visitChildIds.rows) {
    await ensureFamilyChild(invite.plan_id, row.child_id);
  }

  await db.queryObject`
    INSERT INTO user_children (user_id, child_id)
    SELECT DISTINCT ${userId}, j.child_id
    FROM child_journal j
    WHERE j.plan_id = ${invite.plan_id}
      AND NOT EXISTS (
        SELECT 1
        FROM user_children uc
        WHERE uc.user_id = ${userId}
          AND uc.child_id = j.child_id
    );
  `;

  const journalChildIds = await db.queryObject<{ child_id: string }>`
    SELECT DISTINCT j.child_id
    FROM child_journal j
    WHERE j.plan_id = ${invite.plan_id};
  `;

  for (const row of journalChildIds.rows) {
    await ensureFamilyChild(invite.plan_id, row.child_id);
  }

  await ensureMutualParentContactsForPlan(invite.plan_id);

  // Align invited parent's account type with the plan creator (paid stays paid, trial stays trial).
  // This does not process payments; it mirrors the plan creator's current account type to support shared access.
  try {
    const creatorRes = await db.queryObject<{ account_type: "trial" | "paid" | null }>`
      SELECT u.account_type
      FROM parenting_plans p
      JOIN users u ON u.id = p.created_by
      WHERE p.id = ${invite.plan_id}
      LIMIT 1;
    `;

    const creatorType = creatorRes.rows[0]?.account_type;
    if (creatorType === "trial" || creatorType === "paid") {
      await db.queryObject`
        UPDATE users
        SET
          account_type = ${creatorType},
          subscription_status = CASE WHEN ${creatorType} = 'paid' THEN 'active' ELSE 'trial' END
        WHERE id = ${userId};
      `;
    }
  } catch (err) {
    console.warn("Unable to align invited user account type:", err);
  }

  return result.rows[0];
};

const ensureMutualParentContactsForPlan = async (planId: string): Promise<void> => {
  await db.queryObject`
    WITH parent_participants AS (
      SELECT
        pp.user_id,
        COALESCE(NULLIF(BTRIM(u.full_name), ''), u.email) AS full_name,
        CASE
          WHEN u.email IS NULL OR BTRIM(u.email) = '' THEN NULL
          ELSE LOWER(BTRIM(u.email))
        END AS email
      FROM plan_participants pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.plan_id = ${planId}
        AND u.role = 'parent'
    ),
    contact_candidates AS (
      SELECT
        owner.user_id AS owner_user_id,
        peer.user_id AS peer_user_id,
        peer.full_name AS peer_name,
        peer.email AS peer_email
      FROM parent_participants owner
      JOIN parent_participants peer
        ON owner.user_id <> peer.user_id
    )
    INSERT INTO contacts (
      user_id,
      linked_user_id,
      name,
      email,
      relationship
    )
    SELECT
      cc.owner_user_id,
      cc.peer_user_id,
      cc.peer_name,
      cc.peer_email,
      'Co-Parent'
    FROM contact_candidates cc
    WHERE NOT EXISTS (
      SELECT 1
      FROM contacts c
      WHERE c.user_id = cc.owner_user_id
        AND (
          c.linked_user_id = cc.peer_user_id
          OR (
            cc.peer_email IS NOT NULL
            AND c.email IS NOT NULL
            AND LOWER(BTRIM(c.email)) = cc.peer_email
          )
        )
    );
  `;
};

export const isUserInPlan = async (
  planId: string,
  userId: string
): Promise<boolean> => {
  const result = await db.queryObject<{ count: number }>`
    SELECT COUNT(*) FROM plan_participants
    WHERE plan_id = ${planId} AND user_id = ${userId};
  `;
  return Number(result.rows[0].count) > 0;
};

export const getInviteById = async (
  inviteId: string
): Promise<PlanInvite | null> => {
  const result = await db.queryObject<PlanInvite>`
    SELECT * FROM plan_invites WHERE id = ${inviteId}
  `;
  return result.rows[0] ?? null;
};

export const getInviteByToken = async (
  token: string
): Promise<PlanInvite | null> => {
  const normalized = token.trim();
  if (!normalized) return null;

  // Backwards-compatible: if column doesn't exist, this will error; caller should handle.
  const result = await db.queryObject<PlanInvite>`
    SELECT * FROM plan_invites WHERE invite_token = ${normalized}
  `;
  return result.rows[0] ?? null;
};

export const createPlanInviteIfNotExists = async (plan_id: string, email: string): Promise<PlanInvite> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const existing = await db.queryObject<{ id: string }>`
    SELECT id FROM plan_invites
    WHERE plan_id = ${plan_id} AND LOWER(email) = LOWER(${normalizedEmail})
  `;

  if (existing.rows.length > 0) {
    throw new Error("This parent has already been invited to the plan");
  }

  return createPlanInvite(plan_id, normalizedEmail);
};

export const getInvitesByEmail = async (
  email: string
): Promise<PlanInvite[]> => {
  if (!email || typeof email !== "string") return [];

  const result = await db.queryObject<PlanInvite>`
    SELECT * FROM plan_invites
    WHERE LOWER(email) = LOWER(${email})
    AND status = 'pending'
    ORDER BY created_at DESC;
  `;

  return result.rows ?? [];
};
