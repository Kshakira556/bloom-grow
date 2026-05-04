import { z } from "npm:zod";
import { createPrivacyRequest } from "../services/privacyService.ts";
import db from "../db/index.ts";
import { createAuditLog } from "../services/auditService.ts";
import JSZip from "npm:jszip";

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

export const getMyDataExportController = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const userRes = await db.queryObject<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      phone: string | null;
      account_type: string | null;
      subscription_status: string | null;
      created_at: string | null;
      updated_at: string | null;
    }>`
      SELECT id, full_name, email, role, phone, account_type, subscription_status, created_at, updated_at
      FROM users
      WHERE id = ${user.id}
      LIMIT 1;
    `;

    const plansRes = await db.queryObject<{
      id: string;
      title: string;
      status: string;
      created_at: string | null;
    }>`
      SELECT p.id, p.title, p.status, p.created_at
      FROM parenting_plans p
      JOIN plan_participants pp ON pp.plan_id = p.id
      WHERE pp.user_id = ${user.id}
      ORDER BY p.created_at DESC;
    `;

    // Keep this intentionally bounded to reduce risk and load.
    const messagesRes = await db.queryObject<{
      id: string;
      plan_id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      created_at: string;
      is_deleted: boolean;
      is_flagged: boolean;
      is_seen: boolean | null;
      seen_at: string | null;
    }>`
      SELECT id, plan_id, sender_id, receiver_id, content, created_at, is_deleted, is_flagged, is_seen, seen_at
      FROM messages
      WHERE sender_id = ${user.id} OR receiver_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 1000;
    `;

    const childrenRes = await db.queryObject<{ id: string; first_name: string; last_name: string | null; birth_date: string | null }>`
      SELECT DISTINCT c.id, c.first_name, c.last_name, c.birth_date
      FROM children c
      WHERE EXISTS (
        SELECT 1 FROM user_children uc
        WHERE uc.child_id = c.id AND uc.user_id = ${user.id}
      )
      OR EXISTS (
        SELECT 1
        FROM plan_children pc
        JOIN plan_participants pp ON pp.plan_id = pc.plan_id
        WHERE pc.child_id = c.id AND pp.user_id = ${user.id}
      );
    `;

    // Vault documents metadata (if present)
    let documents: unknown[] = [];
    try {
      const docsRes = await db.queryObject<{
        id: string;
        vault_id: string;
        name: string;
        file_url: string;
        category: string | null;
        subcategory: string | null;
        created_at: string;
        deleted_at: string | null;
      }>`
        SELECT d.id, d.vault_id, d.name, d.file_url, d.category, d.subcategory, d.created_at, d.deleted_at
        FROM vault_documents d
        JOIN vaults v ON v.id = d.vault_id
        WHERE d.deleted_at IS NULL
          AND EXISTS (
            SELECT 1
            FROM children c
            WHERE c.id = v.child_id
              AND (
                EXISTS (SELECT 1 FROM user_children uc WHERE uc.child_id = c.id AND uc.user_id = ${user.id})
                OR EXISTS (
                  SELECT 1
                  FROM plan_children pc
                  JOIN plan_participants pp ON pp.plan_id = pc.plan_id
                  WHERE pc.child_id = c.id AND pp.user_id = ${user.id}
                )
              )
          )
        ORDER BY d.created_at DESC
        LIMIT 2000;
      `;
      documents = docsRes.rows;
    } catch {
      documents = [];
    }

    try {
      await createAuditLog({
        actor_id: user.id,
        action: "dsar_export_my_data",
        target_type: "user",
        target_id: user.id,
        notes: JSON.stringify({ messages_limit: 1000 }),
      });
    } catch {
      // ignore
    }

    ctx.response.status = 200;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = {
      exported_at: new Date().toISOString(),
      user: userRes.rows[0] ?? null,
      plans: plansRes.rows,
      children: childrenRes.rows,
      messages: messagesRes.rows,
      vault_documents: documents,
    };
  } catch (err) {
    console.error("getMyDataExportController error:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to export data" };
  }
};

export const getMyDataExportBundleController = async (ctx: any) => {
  try {
    const user = ctx.state.user;
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    // Reuse the same bounded export content as /my-data, but package it into a single ZIP download.
    const userRes = await db.queryObject<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      phone: string | null;
      account_type: string | null;
      subscription_status: string | null;
      created_at: string | null;
      updated_at: string | null;
    }>`
      SELECT id, full_name, email, role, phone, account_type, subscription_status, created_at, updated_at
      FROM users
      WHERE id = ${user.id}
      LIMIT 1;
    `;

    const plansRes = await db.queryObject<{
      id: string;
      title: string;
      status: string;
      created_at: string | null;
    }>`
      SELECT p.id, p.title, p.status, p.created_at
      FROM parenting_plans p
      JOIN plan_participants pp ON pp.plan_id = p.id
      WHERE pp.user_id = ${user.id}
      ORDER BY p.created_at DESC;
    `;

    const messagesRes = await db.queryObject<{
      id: string;
      plan_id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      created_at: string;
      is_deleted: boolean;
      is_flagged: boolean;
      is_seen: boolean | null;
      seen_at: string | null;
    }>`
      SELECT id, plan_id, sender_id, receiver_id, content, created_at, is_deleted, is_flagged, is_seen, seen_at
      FROM messages
      WHERE sender_id = ${user.id} OR receiver_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 1000;
    `;

    const childrenRes = await db.queryObject<{ id: string; first_name: string; last_name: string | null; birth_date: string | null }>`
      SELECT DISTINCT c.id, c.first_name, c.last_name, c.birth_date
      FROM children c
      WHERE EXISTS (
        SELECT 1 FROM user_children uc
        WHERE uc.child_id = c.id AND uc.user_id = ${user.id}
      )
      OR EXISTS (
        SELECT 1
        FROM plan_children pc
        JOIN plan_participants pp ON pp.plan_id = pc.plan_id
        WHERE pc.child_id = c.id AND pp.user_id = ${user.id}
      );
    `;

    let documents: unknown[] = [];
    try {
      const docsRes = await db.queryObject<{
        id: string;
        vault_id: string;
        name: string;
        file_url: string;
        category: string | null;
        subcategory: string | null;
        created_at: string;
        deleted_at: string | null;
      }>`
        SELECT d.id, d.vault_id, d.name, d.file_url, d.category, d.subcategory, d.created_at, d.deleted_at
        FROM vault_documents d
        JOIN vaults v ON v.id = d.vault_id
        WHERE d.deleted_at IS NULL
          AND EXISTS (
            SELECT 1
            FROM children c
            WHERE c.id = v.child_id
              AND (
                EXISTS (SELECT 1 FROM user_children uc WHERE uc.child_id = c.id AND uc.user_id = ${user.id})
                OR EXISTS (
                  SELECT 1
                  FROM plan_children pc
                  JOIN plan_participants pp ON pp.plan_id = pc.plan_id
                  WHERE pc.child_id = c.id AND pp.user_id = ${user.id}
                )
              )
          )
        ORDER BY d.created_at DESC
        LIMIT 2000;
      `;
      documents = docsRes.rows;
    } catch {
      documents = [];
    }

    const exportedAt = new Date().toISOString();

    try {
      await createAuditLog({
        actor_id: user.id,
        action: "dsar_export_my_data_bundle",
        target_type: "user",
        target_id: user.id,
        notes: JSON.stringify({ messages_limit: 1000 }),
      });
    } catch {
      // ignore
    }

    const zip = new JSZip();
    zip.file("README.txt", `CUB - My Data Export (ZIP)\n\nExported at: ${exportedAt}\n\nThis export contains JSON files with information associated with your account. Some data is intentionally bounded (e.g., most recent messages).\n`);
    zip.file("export.json", JSON.stringify({ exported_at: exportedAt }, null, 2));
    zip.file("user.json", JSON.stringify(userRes.rows[0] ?? null, null, 2));
    zip.file("plans.json", JSON.stringify(plansRes.rows, null, 2));
    zip.file("children.json", JSON.stringify(childrenRes.rows, null, 2));
    zip.file("messages.json", JSON.stringify(messagesRes.rows, null, 2));
    zip.file("vault_documents.json", JSON.stringify(documents, null, 2));

    const bytes = await zip.generateAsync({ type: "uint8array" });

    ctx.response.status = 200;
    ctx.response.headers.set("Content-Type", "application/zip");
    ctx.response.headers.set(
      "Content-Disposition",
      `attachment; filename="cub-my-data-${exportedAt.slice(0, 10)}.zip"`,
    );
    ctx.response.body = bytes;
  } catch (err) {
    console.error("getMyDataExportBundleController error:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: err instanceof Error ? err.message : "Failed to export data bundle" };
  }
};
