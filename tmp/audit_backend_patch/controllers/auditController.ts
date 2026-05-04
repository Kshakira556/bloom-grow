import { Context } from "https://deno.land/x/oak/mod.ts";
import { createAuditLog, listAuditLogs } from "../services/auditService.ts";

export const getAuditLogs = async (ctx: Context) => {
  try {
    const logs = await listAuditLogs();
    ctx.response.status = 200;
    ctx.response.body = { logs };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to fetch audit logs" };
  }
};

export const createAuditEventController = async (ctx: any) => {
  try {
    const actorId = ctx.state.user?.id as string | undefined;
    if (!actorId) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const body = await ctx.request.body.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const targetType = typeof body?.target_type === "string" ? body.target_type.trim() : null;
    const rawTargetId = typeof body?.target_id === "string" ? body.target_id.trim() : null;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const targetId = rawTargetId && uuidRegex.test(rawTargetId) ? rawTargetId : null;
    const notes = typeof body?.notes === "string" ? body.notes : null;

    if (!action) {
      ctx.response.status = 400;
      ctx.response.body = { error: "action is required" };
      return;
    }

    const log = await createAuditLog({
      actor_id: actorId,
      action,
      target_type: targetType,
      // Important: target_id column is UUID; if caller sends non-UUID, set null
      target_id: targetId,
      notes,
    });

    ctx.response.status = 201;
    ctx.response.body = { log: { id: log.id } };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to create audit log" };
  }
};
