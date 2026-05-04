import { Router } from "https://deno.land/x/oak/mod.ts";
import { loginUser } from "../controllers/authController.ts";
import { rateLimit } from "../utils/rateLimit.ts";

const router = new Router();
router.post(
  "/api/auth/login",
  rateLimit({ windowMs: 5 * 60 * 1000, max: 25, keyPrefix: "auth:login" }),
  loginUser,
);

export default router;
