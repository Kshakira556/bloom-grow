import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { createPrivacyRequestController, getMyDataExportController } from "../controllers/privacyController.ts";

const router = new Router({ prefix: "/api/privacy" });

router.post("/requests", authMiddleware, createPrivacyRequestController);
router.get("/my-data", authMiddleware, getMyDataExportController);

export default router;
