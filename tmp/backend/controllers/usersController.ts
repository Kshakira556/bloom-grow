import {
  createUser,
  listUsers,
  CreateUserSchema,
  getUserByEmail,
  requestAccountDeletion,
  processDueAccountDeletions,
  setMarketingOptIn,
} from "../services/usersService.ts";
import { generateJWT } from "../utils/jwt.ts";
import { toSafeUserResponse } from "../types/types.ts";
import { sendWelcomeEmail } from "../services/emailService.ts";
import { acceptPlanInvite } from "../services/plansService.ts";
import db from "../db/index.ts";

export const createUserController = async (ctx: any) => {
  const body = await ctx.request.body.json();

  try {
    const validated = CreateUserSchema.parse(body);
    const user = await createUser(validated);
    ctx.response.status = 201;
    ctx.response.body = { user: toSafeUserResponse(user) };
  } catch (error: unknown) {
    ctx.response.status = 400;
    if (error instanceof Error) {
      ctx.response.body = { error: (error as any).errors || error.message };
    } else {
      ctx.response.body = { error: "Unknown error" };
    }
  }
};

export const registerUser = async (ctx: any) => {
  try {
    const body = await ctx.request.body.json();
    const inviteId =
      typeof body?.invite_id === "string" ? body.invite_id.trim() : "";

    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      ctx.response.status = 400;
      ctx.response.body = parsed.error;
      return;
    }

    // Enforce terms/privacy acceptance for self-registration (POPIA openness baseline).
    // Backwards-compatible: if clients don't send the flag, treat as not accepted.
    const termsAccepted = Boolean((body as { terms_accepted?: unknown })?.terms_accepted);
    if (!termsAccepted) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Terms and Privacy Notice must be accepted to register." };
      return;
    }

    const existing = await getUserByEmail(parsed.data.email);
    if (existing) {
      ctx.response.status = 409;
      ctx.response.body = { error: "Email already exists" };
      return;
    }

    const user = await createUser(parsed.data);
    const token = await generateJWT({ id: user.id, role: user.role, email: user.email });
    const safeUser = toSafeUserResponse(user);
    let inviteAccepted = false;
    let inviteError: string | null = null;

    try {
      await sendWelcomeEmail(parsed.data.full_name, parsed.data.email);

      console.log("Email sent to:", parsed.data.email);
    } catch (emailError) {
      console.error("Email failed:", emailError);
    }

    if (inviteId && user.role === "parent") {
      try {
        await acceptPlanInvite(inviteId, user.id, user.email);
        inviteAccepted = true;
      } catch (error) {
        inviteError = error instanceof Error ? error.message : "Invite acceptance failed";
        console.error("Invite acceptance failed during register:", error);
      }
    }

    ctx.response.status = 201;
    ctx.response.body = {
      user: safeUser,
      token,
      invite_accepted: inviteAccepted,
      invite_error: inviteError,
    };
  } catch (error: any) {
    console.error("registerUser error:", error);

    if (error?.message?.includes("duplicate key value") || error?.code === "23505") {
      ctx.response.status = 409;
      ctx.response.body = { error: "Email already exists" };
      return;
    }

    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getUsers = async (ctx: any) => {
  const role = ctx.state.user?.role;
  if (role !== "admin" && role !== "mediator") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Forbidden" };
    return;
  }

  const users = await listUsers();
  ctx.response.body = { users: users.map(toSafeUserResponse) };
};

export const getUserByEmailController = async (ctx: any) => {
  try {
    const email = ctx.params.email;
    if (!email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email is required" };
      return;
    }

    const user = await getUserByEmail(email);
    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    ctx.response.body = { id: user.id, full_name: user.full_name, email: user.email };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getModeratorsController = async (ctx: any) => {
  try {
    if (ctx.state.user?.role !== "admin") {
      ctx.response.status = 403;
      ctx.response.body = { error: "Forbidden" };
      return;
    }

    const users = await listUsers();
    const moderators = users
      .filter((u) => u.role === "mediator" || u.role === "admin")
      .map(toSafeUserResponse);
    ctx.response.body = { moderators };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// --------------------
// POPIA: Account deletion
// --------------------

export const requestAccountDeletionController = async (ctx: any) => {
  try {
    const userId = ctx.state.user?.id as string | undefined;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const body = await ctx.request.body.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim() : undefined;

    const result = await requestAccountDeletion({ userId, reason });

    ctx.response.status = 201;
    ctx.response.body = {
      request: { id: result.request_id, scheduled_for: result.scheduled_for },
    };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const processAccountDeletionsController = async (ctx: any) => {
  try {
    const limitRaw = ctx.request.url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const result = await processDueAccountDeletions({
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    ctx.response.body = result;
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const setMarketingOptInController = async (ctx: any) => {
  try {
    const userId = ctx.state.user?.id as string | undefined;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const body = await ctx.request.body.json().catch(() => ({}));
    const optIn = Boolean(body?.opt_in);

    const updated = await setMarketingOptIn({ userId, optIn });
    ctx.response.status = 200;
    ctx.response.body = { user: updated };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const unsubscribeMarketingController = async (ctx: any) => {
  try {
    const userId = ctx.state.user?.id as string | undefined;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const updated = await setMarketingOptIn({ userId, optIn: false });
    ctx.response.status = 200;
    ctx.response.body = { user: updated };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const listAccountDeletionRequestsController = async (ctx: any) => {
  try {
    // Mediator/admin visibility
    const status = ctx.request.url.searchParams.get("status");

    const { rows } = await db.queryObject<{
      id: string;
      user_id: string;
      requested_at: string;
      scheduled_for: string;
      processed_at: string | null;
      status: string;
      reason: string | null;
    }>`
      SELECT id, user_id, requested_at, scheduled_for, processed_at, status, reason
      FROM account_deletion_requests
      WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})
      ORDER BY requested_at DESC
      LIMIT 200;
    `;

    ctx.response.status = 200;
    ctx.response.body = { requests: rows };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
};
