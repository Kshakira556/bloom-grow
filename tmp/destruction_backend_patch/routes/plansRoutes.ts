import { Router } from "https://deno.land/x/oak/mod.ts";
import { addPlan, getPlans, getPlan, inviteParent, acceptInvite, getMyInvites, resolveInviteToken, requestPlanDestructionController } from "../controllers/plansController.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";

const router = new Router({ prefix: "/api/plans" });

router.post("/", authMiddleware, addPlan);          
router.get("/", authMiddleware, getPlans);
router.post("/invite", authMiddleware, inviteParent); 
router.post("/accept", authMiddleware, acceptInvite); 
router.get("/invites", authMiddleware, getMyInvites); 
router.get("/invites/token/:token", resolveInviteToken);
router.get("/:id", authMiddleware, getPlan);
router.post("/:id/request-destruction", authMiddleware, requestPlanDestructionController);

export default router;
