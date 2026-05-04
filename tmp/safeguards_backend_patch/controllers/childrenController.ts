import { Context, RouterContext } from "https://deno.land/x/oak/mod.ts";
import { ZodError } from "https://deno.land/x/zod/mod.ts";
import { createChild, listChildren, CreateChildSchema, getChildByIdService  } from "../services/childrenService.ts";
import { z } from "npm:zod";
import { createAuditLog } from "../services/auditService.ts";

const uuidSchema = z.string().uuid();

export const addChild = async (ctx: Context) => {
  const body = await ctx.request.body.json();

  try {
    // Validate body using Zod schema
    const validated = CreateChildSchema.parse(body);

    const user = ctx.state.user;

    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const child = await createChild(validated, user.id);
    ctx.response.status = 201;
    ctx.response.body = { child };
  } catch (error: unknown) {
    console.error("❌ addChild error:", error);
    ctx.response.status = 400;

    if (error instanceof ZodError) {
      ctx.response.body = { error: error.errors };
    } else if (error instanceof Error) {
      ctx.response.body = { error: error.message };
    } else {
      ctx.response.body = { error: "Unknown error" };
    }
  }
};

export const getChildren = async (ctx: Context) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const children = await listChildren(user.id);

    try {
      await createAuditLog({
        actor_id: user.id,
        action: "children_list_view",
        target_type: "user",
        target_id: user.id,
        notes: JSON.stringify({ count: children.length }),
      });
    } catch {
      // ignore
    }

    ctx.response.status = 200;
    ctx.response.body = { children };
  } catch (error: unknown) {
    console.error("❌ getChildren error:", error);
    ctx.response.status = 500;
    if (error instanceof Error) {
      ctx.response.body = { error: error.message };
    } else {
      ctx.response.body = { error: "Unknown error" };
    }
  }
};

export const getChildById = async (ctx: RouterContext<"/:id">) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const id = ctx.params.id;

    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid child ID format" };
      return;
    }

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Child ID is required" };
      return;
    }

    const child = await getChildByIdService(id, user.id);
    if (!child) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Child not found" };
      return;
    }

    try {
      await createAuditLog({
        actor_id: user.id,
        action: "child_view",
        target_type: "child",
        target_id: id,
        notes: null,
      });
    } catch {
      // ignore
    }

    ctx.response.status = 200;
    ctx.response.body = { child };
  } catch (error: unknown) {
    console.error("❌ getChildById error:", error);
    ctx.response.status = 500;

    if (error instanceof ZodError) {
      ctx.response.body = { error: error.errors };
    } else if (error instanceof Error) {
      ctx.response.body = { error: error.message };
    } else {
      ctx.response.body = { error: "Unknown error" };
    }
  }
};
