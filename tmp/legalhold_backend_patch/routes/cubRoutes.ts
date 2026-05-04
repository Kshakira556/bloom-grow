import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { requireRoles } from "../utils/roleMiddleware.ts";
import {
  getCubAuditLogs,
  getCubDeletionRequests,
  getCubStorageUsage,
  getCubUserMetrics,
  processPlanDestructions,
  setPlanLegalHold,
  setUserLegalHold,
  processCubDeletions,
} from "../controllers/cubController.ts";

const router = new Router({ prefix: "/api/cub" });

router.use(authMiddleware);
router.use(requireRoles("cub_internal"));

router.get("/audit-logs", getCubAuditLogs);
router.get("/metrics/users", getCubUserMetrics);
router.get("/metrics/storage", getCubStorageUsage);

router.get("/deletions/requests", getCubDeletionRequests);
router.post("/deletions/process", processCubDeletions);
router.post("/destruction/process", processPlanDestructions);

router.put("/legal-hold/users/:id", setUserLegalHold);
router.put("/legal-hold/plans/:id", setPlanLegalHold);

export default router;
