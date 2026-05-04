import { createPlan, listPlans, getPlanWithInvites, createPlanInvite, acceptPlanInvite, CreatePlanSchema, isUserInPlan, createPlanInviteIfNotExists, getInvitesByEmail, getInviteByToken } from "../services/plansService.ts";
import { z } from "npm:zod";
import { sendPlanInviteEmail } from "../services/emailService.ts";
import db from "../db/index.ts";

export const addPlan = async (ctx: any) => {
  try {
    const body = await ctx.request.body.json();
    const validated = CreatePlanSchema.parse(body);
    const plan = await createPlan(validated);
    
    ctx.response.status = 201;
    ctx.response.body = { plan };
  } catch (error: unknown) {
    console.error("❌ addPlan error:", error);
    ctx.response.status = error instanceof z.ZodError ? 400 : 500;

    if (error instanceof Error) {
      ctx.response.body = { error: (error as any).errors || error.message };
    } else {
      ctx.response.body = { error: "Unknown error" };
    }
  }
};

export const getPlans = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    // Fetch all plans
    const plans = await listPlans();

    // Filter to only include plans where the user is a participant
    const participantPlans = [];
    for (const plan of plans) {
      const isParticipant = await isUserInPlan(plan.id, user.id);
      if (isParticipant) participantPlans.push(plan);
    }

    ctx.response.status = 200;
    ctx.response.body = { plans: participantPlans };
  } catch (error: unknown) {
    console.error("❌ getPlans error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getPlan = async (ctx: any) => {
  try {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Plan ID is required" };
      return;
    }
    const allowed = await isUserInPlan(id, user.id);

    if (!allowed) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Access denied" };
      return;
    }

    const plan = await getPlanWithInvites(id);
    if (!plan) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Plan not found" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { plan };
  } catch (error: unknown) {
    console.error("❌ getPlan error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const inviteParent = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    const body = await ctx.request.body.json();
    const { plan_id, email } = body;

    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    if (!plan_id || !email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "plan_id and email are required" };
      return;
    }

    const allowed = await isUserInPlan(plan_id, user.id);
    if (!allowed) {
      ctx.response.status = 403;
      ctx.response.body = { error: "You are not part of this plan" };
      return;
    }

    const invite = await createPlanInviteIfNotExists(plan_id, email);

    try {
      // Prefer invite_token for safer prefill (token resolved by backend). Fall back to id if token not present.
      const token = (invite as { invite_token?: string | null }).invite_token || invite.id;
      await sendPlanInviteEmail(email, token, user.full_name);
      console.log("Invite email sent to:", email);
    } catch (emailError) {
      console.error("Invite email failed:", emailError);
    }

    ctx.response.status = 201;
    ctx.response.body = { invite };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already been invited")) {
      ctx.response.status = 409;
    } else {
      ctx.response.status = 500;
    }
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
    console.error("❌ inviteParent error:", error);
  }
};

export const acceptInvite = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const body = await ctx.request.body.json();
    const invite_id = typeof body?.invite_id === "string" ? body.invite_id : "";
    const invite_token = typeof body?.invite_token === "string" ? body.invite_token : "";

    if (!invite_id && !invite_token) {
      ctx.response.status = 400;
      ctx.response.body = { error: "invite_id or invite_token is required" };
      return;
    }

    let resolvedInviteId = invite_id;
    if (!resolvedInviteId && invite_token) {
      try {
        const inviteByToken = await getInviteByToken(invite_token);
        if (!inviteByToken?.id) {
          ctx.response.status = 404;
          ctx.response.body = { error: "Invitation not found" };
          return;
        }
        resolvedInviteId = inviteByToken.id;
      } catch (e) {
        // If schema isn't migrated yet, token lookup may fail.
        ctx.response.status = 500;
        ctx.response.body = { error: e instanceof Error ? e.message : "Failed to resolve invite token" };
        return;
      }
    }

    const invite = await acceptPlanInvite(
      resolvedInviteId,
      user.id,
      user.email
    );

    if (!invite) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Invitation not found or not for you" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { invite };
  } catch (error: unknown) {
    console.error("❌ acceptInvite error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Public endpoint: resolve invite token for safe prefill (email + suggested account type)
export const resolveInviteToken = async (ctx: any) => {
  try {
    const token = typeof ctx.params?.token === "string" ? ctx.params.token.trim() : "";
    if (!token) {
      ctx.response.status = 400;
      ctx.response.body = { error: "token is required" };
      return;
    }

    const invite = await getInviteByToken(token);
    if (!invite) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Invite not found" };
      return;
    }

    // Suggested account type is derived from the plan creator.
    let suggested: "trial" | "paid" = "trial";
    try {
      const creatorRes = await db.queryObject<{ account_type: "trial" | "paid" | null }>`
        SELECT u.account_type
        FROM parenting_plans p
        JOIN users u ON u.id = p.created_by
        WHERE p.id = ${invite.plan_id}
        LIMIT 1;
      `;
      const t = creatorRes.rows[0]?.account_type;
      if (t === "paid") suggested = "paid";
    } catch {
      // ignore
    }

    ctx.response.status = 200;
    ctx.response.body = {
      invite: {
        invite_id: invite.id,
        email: invite.email,
        account_type: suggested,
      },
    };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getMyInvites = async (ctx: any) => {
  try {
    const user = ctx.state.user;

    const email = user?.email;

    if (!email || typeof email !== "string") {
      console.error("❌ Missing/invalid user email in getMyInvites", user);
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const invites = await getInvitesByEmail(email);

    ctx.response.status = 200;
    ctx.response.body = { invites: invites ?? [] };
  } catch (error: unknown) {
    console.error("❌ getMyInvites error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};
