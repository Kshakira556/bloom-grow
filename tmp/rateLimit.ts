type BucketKey = string;

type Bucket = {
  count: number;
  resetAtMs: number;
};

const buckets = new Map<BucketKey, Bucket>();

const getClientIp = (ctx: any): string => {
  // Prefer proxy headers if present, otherwise fall back to connection info.
  const forwarded = ctx.request?.headers?.get?.("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  return ctx.request?.ip || ctx.request?.serverRequest?.conn?.remoteAddr?.hostname || "unknown";
};

export const rateLimit = (options: { windowMs: number; max: number; keyPrefix: string }) => {
  return async (ctx: any, next: () => Promise<unknown>) => {
    const ip = getClientIp(ctx);
    const key: BucketKey = `${options.keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAtMs <= now) {
      buckets.set(key, { count: 1, resetAtMs: now + options.windowMs });
      await next();
      return;
    }

    if (bucket.count >= options.max) {
      ctx.response.status = 429;
      ctx.response.body = { error: "Too many requests. Please try again later." };
      return;
    }

    bucket.count += 1;
    buckets.set(key, bucket);
    await next();
  };
};

