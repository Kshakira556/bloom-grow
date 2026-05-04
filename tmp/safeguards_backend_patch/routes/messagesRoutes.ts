import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import { sendMessageController, getMessages, updateMessageController, deleteMessageController, getMessageHistoryController, markMessageAsSeenController } from "../controllers/messagesController.ts";
import { wsClients } from "../wsClient.ts";
import { verifyJWT } from "../utils/jwt.ts";
import { rateLimit } from "../utils/rateLimit.ts";

const router = new Router({ prefix: "/api/messages" });

// Standard REST endpoints
router.post("/", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: "messages:send" }), sendMessageController);
router.get("/plan/:plan_id", authMiddleware, getMessages);
router.put("/:id", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: "messages:update" }), updateMessageController);
router.delete("/:id", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 30, keyPrefix: "messages:delete" }), deleteMessageController);

router.get("/history/:id", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "messages:history" }), getMessageHistoryController);
router.put("/seen/:id", authMiddleware, rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "messages:seen" }), markMessageAsSeenController);

// WebSocket endpoint
router.get("/ws", async (ctx) => {
  function assertString(value: string | null, msg: string): string {
    if (value === null) throw new Error(msg);
    console.log("WS token", value);
    return value;
  }

  try {
    const token = assertString(
      ctx.request.url.searchParams.get("token"),
      "Unauthorized: token required"
    );

    // Verify token
    const userPayload = await verifyJWT(token);
    if (!userPayload || typeof userPayload !== "object" || !("id" in userPayload)) {
      console.log("User payload invalid:", userPayload);
      ctx.throw(401, "Unauthorized: invalid token");
    }

    const user = userPayload as { id: string; [key: string]: unknown };

    // Upgrade to WebSocket **without setting ctx.response.body**
    const ws = await ctx.upgrade();

    // Store WS client
    wsClients.set(user.id, ws);

    ws.onmessage = (event) => {
      console.log("WS message from", user.id, event.data);
    };

    ws.onclose = () => {
      console.log("WS connection closed for user", user.id);
      wsClients.delete(user.id);
    };
  } catch (err) {
    console.error("WS connection failed:", err);
    // Don't use ctx.throw after upgrade attempt
  }
});

export default router;
