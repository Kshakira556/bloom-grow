import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { getAuditLogs } from "../controllers/auditController.ts";
import { getModeratorsController, processAccountDeletionsController, listAccountDeletionRequestsController } from "../controllers/usersController.ts";
import { requireRoles } from "../utils/roleMiddleware.ts";

const router = new Router({ prefix: "/api/admin" });

router.get("/audit-logs", authMiddleware, getAuditLogs);
router.get("/moderators", authMiddleware, requireRoles("admin"), getModeratorsController);
router.post("/deletions/process", authMiddleware, requireRoles("admin", "mediator"), processAccountDeletionsController);
router.get("/deletions/requests", authMiddleware, requireRoles("admin", "mediator"), listAccountDeletionRequestsController);

export default router;
