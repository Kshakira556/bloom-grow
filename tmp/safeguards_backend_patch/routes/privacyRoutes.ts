import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { createPrivacyRequestController, getMyDataExportController } from "../controllers/privacyController.ts";
import { rateLimit } from "../utils/rateLimit.ts";

const router = new Router({ prefix: "/api/privacy" });

router.post("/requests", authMiddleware, rateLimit({ windowMs: 10 * 60 * 1000, max: 10, keyPrefix: "privacy:requests" }), createPrivacyRequestController);
router.get("/my-data", authMiddleware, rateLimit({ windowMs: 10 * 60 * 1000, max: 5, keyPrefix: "privacy:my-data" }), getMyDataExportController);

export default router;
