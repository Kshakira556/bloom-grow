import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { createAuditEventController } from "../controllers/auditController.ts";

const router = new Router({ prefix: "/api/audit" });

router.post("/events", authMiddleware, createAuditEventController);

export default router;

