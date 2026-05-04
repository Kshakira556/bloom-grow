import { Router } from "https://deno.land/x/oak/mod.ts";
import {
  registerUser,
  getUsers,
  getUserByEmailController,
  requestAccountDeletionController,
} from "../controllers/usersController.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { requireRoles } from "../utils/roleMiddleware.ts";
import { rateLimit } from "../utils/rateLimit.ts";

const router = new Router({ prefix: "/api/users" });

router.post("/register", rateLimit({ windowMs: 10 * 60 * 1000, max: 10, keyPrefix: "users:register" }), registerUser);
router.get("/", authMiddleware, requireRoles("admin", "mediator"), getUsers);
router.get("/email/:email", authMiddleware, getUserByEmailController);
router.post("/deletion-request", authMiddleware, requestAccountDeletionController);

export default router;
