import { createPlan, listPlans, getPlanWithInvites, createPlanInvite, acceptPlanInvite, CreatePlanSchema, isUserInPlan, createPlanInviteIfNotExists, getInvitesByEmail } from "../services/plansService.ts";
import { z } from "npm:zod";
import { sendPlanInviteEmail } from "../services/emailService.ts";

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
      await sendPlanInviteEmail(email, invite.id, user.full_name, user?.account_type === "paid" ? "paid" : "trial");
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
    const { invite_id } = body;

    if (!invite_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "invite_id is required" };
      return;
    }

    const invite = await acceptPlanInvite(
      invite_id,
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
