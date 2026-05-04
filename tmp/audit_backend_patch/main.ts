import "https://deno.land/std/dotenv/load.ts";

import { Application, send } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { connectDB } from "./db/index.ts";
import authRoutes from "./routes/authRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";
import childrenRoutes from "./routes/childrenRoutes.ts";
import plansRoutes from "./routes/plansRoutes.ts";
import visitsRoutes from "./routes/visitsRoutes.ts";
import messagesRoutes from "./routes/messagesRoutes.ts";
import journalRoutes from "./routes/journalRoutes.ts";
import { PORT } from "./config.ts";
import vaultRoutes from "./routes/vaultRoutes.ts";  
import guardianRoutes from "./routes/guardianRoutes.ts";
import medicalRoutes from "./routes/medicalRoutes.ts";
import legalCustodyRoutes from "./routes/legalCustodyRoutes.ts";
import safetyRoutes from "./routes/safetyRoutes.ts";
import emergencyContactRoutes from "./routes/emergencyContactRoutes.ts";
import documentRoutes from "./routes/documentRoutes.ts";
import contactsRoutes from "./routes/contactsRoutes.ts";
import proposalsRoutes from "./routes/proposalsRoutes.ts";
import moderationRoutes from "./routes/moderationRoutes.ts";
import adminRoutes from "./routes/adminRoutes.ts";
import adminMessagesRoutes from "./routes/adminMessagesRoutes.ts";
import moderatorAssignmentsRoutes from "./routes/moderatorAssignmentsRoutes.ts";
import privacyRoutes from "./routes/privacyRoutes.ts";
import auditRoutes from "./routes/auditRoutes.ts";

const app = new Application();

app.use(
  oakCors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8080",
      "https://bloom-grow-gamma.vercel.app",
      "https://www.cubapp.co.za",
      "https://cubapp.co.za"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

app.use(async (ctx, next) => {
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    const status =
      typeof (err as { status?: unknown })?.status === "number"
        ? ((err as { status?: number }).status as number)
        : 500;

    console.error("Request failed:", message);

    ctx.response.status = status;
    ctx.response.body = { error: message };
  }
});

app.use(async (ctx, next) => {
  await next();

  ctx.response.headers.set("Access-Control-Max-Age", "86400");
});

app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());

app.use(childrenRoutes.routes());
app.use(childrenRoutes.allowedMethods());

app.use(plansRoutes.routes());
app.use(plansRoutes.allowedMethods());

app.use(visitsRoutes.routes());
app.use(visitsRoutes.allowedMethods());

app.use(messagesRoutes.routes());
app.use(messagesRoutes.allowedMethods());

app.use(contactsRoutes.routes());
app.use(contactsRoutes.allowedMethods());

app.use(journalRoutes.routes());
app.use(journalRoutes.allowedMethods());

app.use(vaultRoutes.routes());
app.use(vaultRoutes.allowedMethods());

app.use(guardianRoutes.routes());
app.use(guardianRoutes.allowedMethods());

app.use(medicalRoutes.routes());
app.use(medicalRoutes.allowedMethods());

app.use(legalCustodyRoutes.routes());
app.use(legalCustodyRoutes.allowedMethods());

app.use(safetyRoutes.routes());
app.use(safetyRoutes.allowedMethods());

app.use(emergencyContactRoutes.routes());
app.use(emergencyContactRoutes.allowedMethods());

app.use(documentRoutes.routes());
app.use(documentRoutes.allowedMethods());

app.use(proposalsRoutes.routes());
app.use(proposalsRoutes.allowedMethods());

app.use(moderationRoutes.routes());
app.use(moderationRoutes.allowedMethods());

app.use(adminRoutes.routes());
app.use(adminRoutes.allowedMethods());

app.use(adminMessagesRoutes.routes());
app.use(adminMessagesRoutes.allowedMethods());

app.use(moderatorAssignmentsRoutes.routes());
app.use(moderatorAssignmentsRoutes.allowedMethods());

app.use(privacyRoutes.routes());
app.use(privacyRoutes.allowedMethods());

app.use(auditRoutes.routes());
app.use(auditRoutes.allowedMethods());

const swaggerDist = `${Deno.cwd()}/swagger/node_modules/swagger-ui-dist`;

app.use(async (ctx, next) => {
  const path = ctx.request.url.pathname;

  if (path === "/docs" || path === "/docs/") {
    await send(ctx, "index.html", { root: `${Deno.cwd()}/swagger` });
  } else if (path.startsWith("/swagger-ui/")) {
    await send(ctx, path.replace("/swagger-ui", ""), { root: swaggerDist });
  } else if (path === "/swagger.json") {
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = await Deno.readTextFile("swagger/swagger.json");
  } else {
    await next();
  }
});

/* ---------------------------------------------
   ✅ SERVER START
---------------------------------------------- */
console.log(`✅ Server running: http://localhost:${PORT}`);
console.log(`📘 Swagger UI: http://localhost:${PORT}/docs`);

await app.listen({ port: PORT });
