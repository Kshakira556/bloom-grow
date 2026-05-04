import { getVaultDiscovery } from "../services/vaultDiscoveryService.ts";
import { createAuditLog } from "../services/auditService.ts";

export const getVaultDiscoveryController = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const { vault_id } = ctx.params;
    if (!vault_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "vault_id is required" };
      return;
    }

    const discovery = await getVaultDiscovery(vault_id);

    try {
      // Note: discovery can be called frequently; keep audit lightweight.
      await createAuditLog({
        actor_id: user.id,
        action: "vault_discovery_view",
        target_type: "vault",
        target_id: vault_id,
        notes: null,
      });
    } catch {
      // ignore
    }

    // Return discovery object directly, matching other "exists" endpoints
    ctx.response.status = 200;
    ctx.response.body = discovery;
  } catch (error: unknown) {
    console.error("❌ getVaultDiscovery error:", error);

    if (error instanceof Error) {
      ctx.response.status = 500;
      ctx.response.body = { error: error.message };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Unknown error" };
    }
  }
};
