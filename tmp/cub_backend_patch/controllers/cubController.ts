import db from "../db/index.ts";
import { listAuditLogs } from "../services/auditService.ts";
import { getSupabaseAdminClient, getSupabaseBucket } from "../services/supabaseService.ts";
import { listAccountDeletionRequestsController, processAccountDeletionsController } from "./usersController.ts";

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

