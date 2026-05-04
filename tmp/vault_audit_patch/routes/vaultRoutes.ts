import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { addVault, getVault, editVault, removeVault } from "../controllers/vaultController.ts";
import { getVaultDiscoveryController } from "../controllers/vaultDiscoveryController.ts";
import { rateLimit } from "../utils/rateLimit.ts";

const router = new Router({ prefix: "/api/vaults" });

router.post("/", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 30, keyPrefix: "vault:create" }), addVault);
router.get("/:vault_id/discovery", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "vault:discovery" }), getVaultDiscoveryController);
router.get("/:child_id", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "vault:get" }), getVault);
router.put("/:vault_id", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: "vault:update" }), editVault);
router.delete("/:vault_id", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 20, keyPrefix: "vault:delete" }), removeVault);

export default router;
