import type { User } from "../types/types.ts";

export const requireRoles = (...allowedRoles: User["role"][]) => {
  return async (ctx: any, next: any) => {
    const role = ctx.state.user?.role as User["role"] | undefined;

    if (!role || !allowedRoles.includes(role)) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Forbidden" };
      return;
    }

    await next();
  };
};
