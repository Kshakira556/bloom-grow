import { createVault, getVaultByChild, updateVault, deleteVault, VaultSchema } from "../services/vaultService.ts";
import { z } from "npm:zod";
import { getChildByIdService } from "../services/childrenService.ts";
import { createAuditLog } from "../services/auditService.ts";

export const addVault = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const body = await ctx.request.body.json();
    if (body?.child_id) {
      const child = await getChildByIdService(body.child_id, user.id);
      if (!child) {
        ctx.response.status = 403;
        ctx.response.body = { error: "Access denied" };
        return;
      }
    }

    const vault = await createVault(body);

    ctx.response.status = 201;
    ctx.response.body = { vault };
  } catch (error: unknown) {
    console.error("❌ addVault error:", error);

    if (error instanceof Error && error.message === "Vault already exists for this child") {
      ctx.response.status = 409;
      ctx.response.body = { error: error.message };
      return;
    }

    ctx.response.status = error instanceof z.ZodError ? 400 : 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getVault = async (ctx: any) => {
  const user = ctx.state.user;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const { child_id } = ctx.params;
  if (!child_id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "child_id is required" };
    return;
  }

  const child = await getChildByIdService(child_id, user.id);
  if (!child) {
    ctx.response.status = 403;
    ctx.response.body = { error: "Access denied" };
    return;
  }

  const vault = await getVaultByChild(child_id);
  if (!vault) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Vault not found" };
    return;
  }

  try {
    await createAuditLog({
      actor_id: user.id,
      action: "vault_view",
      target_type: "vault",
      target_id: vault.id,
      notes: JSON.stringify({ child_id }),
    });
  } catch {
    // ignore
  }

  ctx.response.status = 200;
  ctx.response.body = { vault };
};

export const editVault = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const { vault_id } = ctx.params;
    const body = await ctx.request.body.json();
    const updatedVault = await updateVault(vault_id, body);

    ctx.response.status = 200;
    ctx.response.body = { vault: updatedVault };
  } catch (error: unknown) {
    console.error("❌ editVault error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const removeVault = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const { vault_id } = ctx.params;
    await deleteVault(vault_id);

    ctx.response.status = 204;
  } catch (error: unknown) {
    console.error("❌ removeVault error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};
