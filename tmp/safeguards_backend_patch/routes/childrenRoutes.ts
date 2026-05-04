import { Router } from "https://deno.land/x/oak/mod.ts";
import { addChild, getChildren, getChildById } from "../controllers/childrenController.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { rateLimit } from "../utils/rateLimit.ts";

const router = new Router({ prefix: "/api/children" });

router.post("/", authMiddleware, addChild);
router.get("/", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "children:list" }), getChildren);
router.get("/:id", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "children:get" }), getChildById);

export default router;
