import { z } from "npm:zod";
import { createPrivacyRequest } from "../services/privacyService.ts";

const CreatePrivacyRequestSchema = z.object({
  request_type: z.enum(["access", "correction", "deletion", "objection"]),
  details: z.string().optional(),
  contact_email: z.string().email().optional(),
});

export const createPrivacyRequestController = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    const body = await ctx.request.body.json();
    const parsed = CreatePrivacyRequestSchema.safeParse(body);

    if (!parsed.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: parsed.error };
      return;
    }

    const request = await createPrivacyRequest({
      user_id: user?.id ?? null,
      request_type: parsed.data.request_type,
      details: parsed.data.details?.trim() || null,
      contact_email: parsed.data.contact_email?.trim() || null,
    });

    ctx.response.status = 201;
    ctx.response.body = { request };
  } catch (err) {
    console.error("createPrivacyRequestController error:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to create privacy request" };
  }
};

