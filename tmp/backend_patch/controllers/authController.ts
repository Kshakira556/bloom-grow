import { Context } from "https://deno.land/x/oak/mod.ts";
import { login } from "../services/authService.ts";

export const loginUser = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const { email, password } = body;

    const result = await login(email, password);

    if (!result) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid credentials" };
      return;
    }

    ctx.response.body = result;
  } catch (err) {
    console.error("loginUser error:", err);

    const message = err instanceof Error ? err.message : "Unknown error";
    if (typeof message === "string" && message.toLowerCase().includes("pending deletion")) {
      ctx.response.status = 403;
      ctx.response.body = {
        error:
          "This account is pending deletion. If you believe this is an error, contact the POPIA Director.",
      };
      return;
    }

    ctx.response.status = 500;
    ctx.response.body = { error: message };
  }
};
