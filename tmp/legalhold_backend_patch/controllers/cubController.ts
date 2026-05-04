import db from "../db/index.ts";
import { listAuditLogs } from "../services/auditService.ts";
import { getSupabaseAdminClient, getSupabaseBucket } from "../services/supabaseService.ts";
import { listAccountDeletionRequestsController, processAccountDeletionsController } from "./usersController.ts";
import { createAuditLog } from "../services/auditService.ts";

export const getCubAuditLogs = async (ctx: any) => {
  try {
    const logs = await listAuditLogs();
    ctx.response.status = 200;
    ctx.response.body = { logs };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to fetch audit logs" };
  }
};

export const getCubUserMetrics = async (ctx: any) => {
  try {
    const totalsRes = await db.queryObject<{
      users: number;
      parents: number;
      mediators: number;
      admins: number;
      cub_internal: number;
      paid: number;
      trial: number;
    }>`
      SELECT
        COUNT(*)::int AS users,
        COUNT(*) FILTER (WHERE role = 'parent')::int AS parents,
        COUNT(*) FILTER (WHERE role = 'mediator')::int AS mediators,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS admins,
        COUNT(*) FILTER (WHERE role = 'cub_internal')::int AS cub_internal,
        COUNT(*) FILTER (WHERE account_type = 'paid')::int AS paid,
        COUNT(*) FILTER (WHERE account_type = 'trial')::int AS trial
      FROM users
      WHERE deleted_at IS NULL;
    `;

    const row = totalsRes.rows[0] ?? {
      users: 0,
      parents: 0,
      mediators: 0,
      admins: 0,
      cub_internal: 0,
      paid: 0,
      trial: 0,
    };

    ctx.response.status = 200;
    ctx.response.body = {
      metrics: {
        totals: {
          users: row.users,
          parents: row.parents,
          mediators: row.mediators,
          admins: row.admins,
          cub_internal: row.cub_internal,
        },
        subscriptions: {
          paid: row.paid,
          trial: row.trial,
        },
      },
    };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to fetch metrics" };
  }
};

export const getCubStorageUsage = async (ctx: any) => {
  try {
    const client = getSupabaseAdminClient();
    const bucket = getSupabaseBucket();

    const byPrefix: Record<string, { bytes: number; files: number }> = {};
    let totalBytes = 0;
    let totalFiles = 0;

    // Walk storage in pages. Guard to avoid runaway costs.
    const limit = 1000;
    const maxObjects = 5000;
    let offset = 0;

    while (offset < maxObjects) {
      const { data, error } = await client.storage.from(bucket).list("", {
        limit,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(error.message);
      const items = data ?? [];
      if (items.length === 0) break;

      for (const obj of items) {
        // Group by first path segment (vault_id prefix in our storage path design)
        const name = (obj as { name?: string }).name || "";
        if (!name) continue;
        const prefix = name.split("/")[0] || "unknown";

        const size =
          (obj as any)?.metadata?.size ??
          (obj as any)?.metadata?.contentLength ??
          (obj as any)?.size ??
          0;

        const bytes = typeof size === "number" && Number.isFinite(size) ? size : 0;

        if (!byPrefix[prefix]) byPrefix[prefix] = { bytes: 0, files: 0 };
        byPrefix[prefix].bytes += bytes;
        byPrefix[prefix].files += 1;
        totalBytes += bytes;
        totalFiles += 1;
      }

      offset += items.length;
      if (items.length < limit) break;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      usage: {
        total_bytes: totalBytes,
        total_files: totalFiles,
        by_prefix: byPrefix,
      },
    };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to fetch storage usage" };
  }
};

// Re-export user deletion controllers for convenience under /api/cub
export const getCubDeletionRequests = listAccountDeletionRequestsController;
export const processCubDeletions = processAccountDeletionsController;

// --------------------
// Plan destruction (redaction) job
// --------------------

const redactPlanScopedRecords = async (planId: string) => {
  // Messages
  await db.queryObject`
    UPDATE messages
    SET
      content = '[REDACTED]',
      is_flagged = FALSE,
      flagged_reason = NULL,
      updated_at = NOW()
    WHERE plan_id = ${planId};
  `;

  await db.queryObject`
    UPDATE message_history
    SET content = '[REDACTED]'
    WHERE plan_id = ${planId};
  `;

  // Visits
  await db.queryObject`
    UPDATE visits
    SET location = NULL,
        notes = NULL,
        updated_at = NOW()
    WHERE plan_id = ${planId};
  `;

  // Visit change requests (contains proposed_data JSON)
  await db.queryObject`
    UPDATE visit_change_requests
    SET proposed_data = '{}'::jsonb,
        reviewed_at = reviewed_at,
        applied_at = applied_at
    WHERE plan_id = ${planId};
  `;

  // Journal entries
  await db.queryObject`
    UPDATE child_journal
    SET content = '[REDACTED]',
        title = '[REDACTED]',
        mood = NULL,
        image = NULL,
        updated_at = NOW()
    WHERE plan_id = ${planId};
  `;

  // Plan proposals
  await db.queryObject`
    UPDATE plan_proposals
    SET title = '[REDACTED]',
        description = '[REDACTED]',
        updated_at = NOW()
    WHERE plan_id = ${planId};
  `;
};

export const processPlanDestructions = async (ctx: any) => {
  try {
    const limitRaw = ctx.request.url.searchParams.get("limit");
    const limit = Math.max(1, Math.min(200, limitRaw ? Number(limitRaw) : 50));
    const now = new Date();

    const plans = await db.queryObject<{
      id: string;
    }>`
      SELECT id
      FROM parenting_plans
      WHERE redacted_at IS NULL
        AND destruction_due_at IS NOT NULL
        AND destruction_due_at <= ${now}
        AND COALESCE(legal_hold, FALSE) = FALSE
        AND COALESCE(destruction_status, '') = 'pending_destruction'
      ORDER BY destruction_due_at ASC
      LIMIT ${limit};
    `;

    for (const p of plans.rows) {
      // Transaction per plan to avoid partial redaction.
      await db.queryObject`BEGIN;`;
      try {
        await redactPlanScopedRecords(p.id);

        await db.queryObject`
          UPDATE parenting_plans
          SET
            redacted_at = NOW(),
            destruction_status = 'redacted',
            updated_at = NOW()
          WHERE id = ${p.id}
            AND redacted_at IS NULL;
        `;

        try {
          const actorId = ctx.state.user?.id as string | undefined;
          if (actorId) {
            await createAuditLog({
              actor_id: actorId,
              action: "plan_redacted",
              target_type: "plan",
              target_id: p.id,
              notes: JSON.stringify({ processed_at: now.toISOString() }),
            });
          }
        } catch {
          // ignore
        }

        await db.queryObject`COMMIT;`;
      } catch (e) {
        await db.queryObject`ROLLBACK;`;
        throw e;
      }
    }

    ctx.response.status = 200;
    ctx.response.body = { processed: plans.rows.length };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to process plan destructions" };
  }
};

// --------------------
// Legal hold controls (CUB internal)
// --------------------

export const setUserLegalHold = async (ctx: any) => {
  try {
    const userId = typeof ctx.params?.id === "string" ? ctx.params.id : "";
    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "User id is required" };
      return;
    }

    const body = await ctx.request.body.json().catch(() => ({}));
    const legalHold = Boolean(body?.legal_hold);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : null;

    const updated = await db.queryObject<{ id: string; legal_hold: boolean }>`
      UPDATE users
      SET legal_hold = ${legalHold}
      WHERE id = ${userId}
      RETURNING id, legal_hold;
    `;

    if (!updated.rows[0]) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    try {
      const actorId = ctx.state.user?.id as string | undefined;
      if (actorId) {
        await createAuditLog({
          actor_id: actorId,
          action: legalHold ? "legal_hold_enabled_user" : "legal_hold_disabled_user",
          target_type: "user",
          target_id: userId,
          notes: reason ? JSON.stringify({ reason }) : null,
        });
      }
    } catch {
      // ignore
    }

    ctx.response.status = 200;
    ctx.response.body = { user: updated.rows[0] };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to update legal hold" };
  }
};

export const setPlanLegalHold = async (ctx: any) => {
  try {
    const planId = typeof ctx.params?.id === "string" ? ctx.params.id : "";
    if (!planId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Plan id is required" };
      return;
    }

    const body = await ctx.request.body.json().catch(() => ({}));
    const legalHold = Boolean(body?.legal_hold);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : null;

    const updated = await db.queryObject<{ id: string; legal_hold: boolean }>`
      UPDATE parenting_plans
      SET legal_hold = ${legalHold}
      WHERE id = ${planId}
      RETURNING id, legal_hold;
    `;

    if (!updated.rows[0]) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Plan not found" };
      return;
    }

    try {
      const actorId = ctx.state.user?.id as string | undefined;
      if (actorId) {
        await createAuditLog({
          actor_id: actorId,
          action: legalHold ? "legal_hold_enabled_plan" : "legal_hold_disabled_plan",
          target_type: "plan",
          target_id: planId,
          notes: reason ? JSON.stringify({ reason }) : null,
        });
      }
    } catch {
      // ignore
    }

    ctx.response.status = 200;
    ctx.response.body = { plan: updated.rows[0] };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to update legal hold" };
  }
};
