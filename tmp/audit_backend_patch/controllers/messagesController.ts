import { sendMessage, getMessagesByPlan, updateMessage, deleteMessage, getMessageHistory, markMessageAsSeen, flagMessage } from "../services/messagesService.ts";
import { wsClients } from "../wsClient.ts";
import db from "../db/index.ts";
import { isUserParticipant } from "../utils/permissions.ts";
import { createAuditLog } from "../services/auditService.ts";

export const sendMessageController = async (ctx: any) => {
  try {
    const body = await ctx.request.body.json();
    const user = ctx.state.user;

    // Ensure sender matches authenticated user
    if (body.sender_id !== user.id) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Forbidden: sender_id mismatch" };
      return;
    }

    let receiver_id = body.receiver_id;

    // ✅ If sending via contact instead of direct user
    if (!receiver_id && body.contact_id) {
      const contact = await db.queryObject<{ linked_user_id: string | null }>`
        SELECT linked_user_id
        FROM contacts
        WHERE id = ${body.contact_id}
          AND user_id = ${user.id};
      `;

      if (!contact.rows[0] || !contact.rows[0].linked_user_id) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Contact not linked to a platform user" };
        return;
      }

      receiver_id = contact.rows[0].linked_user_id;
    }

    if (!receiver_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Receiver required" };
      return;
    }

    // ✅ OPTIONAL but STRONGLY recommended
    const allowed = await isUserParticipant(body.plan_id, user.id);
    if (!allowed) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Access denied to this plan" };
      return;
    }

    const message = await sendMessage({
      sender_id: body.sender_id,
      receiver_id,
      plan_id: body.plan_id,
      content: body.content,
    });

    // Broadcast to receiver if online
    const receiverWS = wsClients.get(receiver_id);
    if (receiverWS && receiverWS.readyState === WebSocket.OPEN) {
      receiverWS.send(JSON.stringify({ type: "new_message", message }));
    }

    ctx.response.status = 201;
    ctx.response.body = { message };

  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: err instanceof Error ? err.message : "Failed to send message"
    };
  }
};

export const getMessages = async (ctx: any) => {
  try {
    const plan_id = ctx.params.plan_id;
    const user = ctx.state.user;

    // Allow access if user is a participant OR is a moderator/admin
    const isParticipant = await isUserParticipant(plan_id, user.id);
    const isModerator = user.role === "mediator" || user.role === "admin";
    const isMediator = user.role === "mediator";

    if (!isParticipant && !isModerator && !isMediator) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Access denied" };
      return;
    }

    const includeDeleted = ctx.request.url.searchParams.get("include_deleted") === "true";

    const messages = await getMessagesByPlan(plan_id, user.id, includeDeleted);
    ctx.response.body = { messages };
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: err instanceof Error ? err.message : "Failed to fetch messages",
    };
  }
};

export const updateMessageController = async (ctx: any) => {
  try {
    const id = ctx.params.id;
    const body = await ctx.request.body.json();
    const user = ctx.state.user;

    if (typeof body?.content === "string") {
      const updated = await updateMessage(id, body.content, user.id);

      try {
        await createAuditLog({
          actor_id: user.id,
          action: "message_edit",
          target_type: "message",
          target_id: id,
          notes: JSON.stringify({ plan_id: updated?.plan_id ?? null }),
        });
      } catch (e) {
        console.warn("Audit log failed (message_edit):", e);
      }

      ctx.response.body = { message: updated };
      return;
    }

    if (typeof body?.is_flagged === "boolean" || typeof body?.flagged_reason === "string") {
      const updated = await flagMessage(
        id,
        {
          is_flagged: typeof body?.is_flagged === "boolean" ? body.is_flagged : true,
          flagged_reason: typeof body?.flagged_reason === "string" ? body.flagged_reason : undefined,
        },
        user
      );

      try {
        await createAuditLog({
          actor_id: user.id,
          action: "message_flag",
          target_type: "message",
          target_id: id,
          notes: JSON.stringify({ plan_id: updated?.plan_id ?? null }),
        });
      } catch (e) {
        console.warn("Audit log failed (message_flag):", e);
      }

      ctx.response.body = { message: updated };
      return;
    }

    ctx.response.status = 400;
    ctx.response.body = { error: "Nothing to update" };
  } catch (err: unknown) {
    if (err instanceof Error) {
      ctx.response.status = 404;
      ctx.response.body = { error: err.message };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Unknown error occurred" };
    }
  }
};

export const deleteMessageController = async (ctx: any) => {
  try {
    const id = ctx.params.id;
    const user_id = ctx.state.user.id;
    const deleted = await deleteMessage(id, user_id);

    try {
      await createAuditLog({
        actor_id: user_id,
        action: "message_delete",
        target_type: "message",
        target_id: id,
        notes: JSON.stringify({ plan_id: deleted?.plan_id ?? null }),
      });
    } catch (e) {
      console.warn("Audit log failed (message_delete):", e);
    }

    ctx.response.status = 200; 
    ctx.response.body = { message: deleted };
  } catch (err: unknown) {
    if (err instanceof Error) {
      ctx.response.status = 404; 
      ctx.response.body = { error: err.message };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Unknown error occurred" };
    }
  }
};

export const getMessageHistoryController = async (ctx: any) => {
  try {
    const id = ctx.params.id;
    const result = await getMessageHistory(id);
    ctx.response.body = { history: result };
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to fetch history" };
  }
};

export const markMessageAsSeenController = async (ctx: any) => {
  try {
    const message_id = ctx.params.id;
    const user_id = ctx.state.user.id;

    const updatedMessage = await markMessageAsSeen(message_id, user_id);

    try {
      await createAuditLog({
        actor_id: user_id,
        action: "message_seen",
        target_type: "message",
        target_id: message_id,
        notes: JSON.stringify({ plan_id: updatedMessage?.plan_id ?? null }),
      });
    } catch (e) {
      console.warn("Audit log failed (message_seen):", e);
    }

    ctx.response.status = 200;
    ctx.response.body = { message: updatedMessage };
  } catch (err: unknown) {
    ctx.response.status = 400;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to mark as seen" };
  }
};

