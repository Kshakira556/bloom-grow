import {
  addDocument,
  getDocumentById,
  listDocumentsByVaultId,
  softDeleteDocumentById,
  updateDocumentById,
} from "../services/documentService.ts";
import { getVaultById } from "../services/vaultService.ts";
import { getChildByIdService } from "../services/childrenService.ts";
import { getSupabaseAdminClient, getSupabaseBucket } from "../services/supabaseService.ts";
import { createAuditLog } from "../services/auditService.ts";

const ensureVaultAccess = async (ctx: any, vaultId: string) => {
  const user = ctx.state.user;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return null;
  }

  const vault = await getVaultById(vaultId);
  if (!vault) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Vault not found" };
    return null;
  }

  const child = await getChildByIdService(vault.child_id, user.id);
  if (!child) {
    ctx.response.status = 403;
    ctx.response.body = { error: "Access denied" };
    return null;
  }

  return vault;
};

const sanitizeFilename = (name: string) => {
  const trimmed = name.trim();
  const base = trimmed.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.length > 120 ? base.slice(-120) : base;
};

const coerceStoragePath = (fileUrlOrPath: string, bucket: string): string => {
  const raw = (fileUrlOrPath || "").trim();
  if (!raw) return raw;

  // Already a relative path
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    return raw.replace(/^\/+/, "");
  }

  // Attempt to extract the object path from common Supabase URLs.
  // Examples:
  // - .../storage/v1/object/public/<bucket>/<path>
  // - .../storage/v1/object/sign/<bucket>/<path>?token=...
  const markerPublic = `/storage/v1/object/public/${bucket}/`;
  const markerSign = `/storage/v1/object/sign/${bucket}/`;
  const idxPublic = raw.indexOf(markerPublic);
  const idxSign = raw.indexOf(markerSign);

  const idx = idxPublic >= 0 ? idxPublic + markerPublic.length : idxSign >= 0 ? idxSign + markerSign.length : -1;
  if (idx < 0) return raw; // fall back (will likely fail, but avoids changing data silently)

  const after = raw.slice(idx);
  return after.split("?")[0]?.replace(/^\/+/, "") ?? after;
};

export const listDocumentsController = async (ctx: any) => {
  try {
    const { vault_id } = ctx.params;

    if (!vault_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "vault_id is required" };
      return;
    }

    const vault = await ensureVaultAccess(ctx, vault_id);
    if (!vault) return;

    const documents = await listDocumentsByVaultId(vault_id);
    ctx.response.status = 200;
    ctx.response.body = { documents };
  } catch (error) {
    console.error("listDocuments error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to list documents" };
  }
};

export const addDocumentController = async (ctx: any) => {
  try {
    const { vault_id } = ctx.params;
    const body = await ctx.request.body.json();

    const vault = await ensureVaultAccess(ctx, vault_id);
    if (!vault) return;

    const document = await addDocument({ ...body, vault_id });
    ctx.response.status = 201;
    ctx.response.body = { document };
  } catch (error) {
    console.error("addDocument error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to add document" };
  }
};

export const getDocumentController = async (ctx: any) => {
  try {
    const { id } = ctx.params;
    const document = await getDocumentById(id);

    if (!document) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Document not found" };
      return;
    }

    const vault = await ensureVaultAccess(ctx, document.vault_id);
    if (!vault) return;

    ctx.response.status = 200;
    ctx.response.body = { document };
  } catch (error) {
    console.error("getDocument error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get document" };
  }
};

export const updateDocumentController = async (ctx: any) => {
  try {
    const { id } = ctx.params;
    const body = await ctx.request.body.json();

    const existing = await getDocumentById(id);
    if (!existing) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Document not found" };
      return;
    }

    const vault = await ensureVaultAccess(ctx, existing.vault_id);
    if (!vault) return;

    const document = await updateDocumentById(id, body);

    if (!document) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Document not found" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { document };
  } catch (error) {
    console.error("updateDocument error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update document" };
  }
};

export const deleteDocumentController = async (ctx: any) => {
  try {
    const { id } = ctx.params;
    const existing = await getDocumentById(id);
    if (!existing) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Document not found" };
      return;
    }

    const vault = await ensureVaultAccess(ctx, existing.vault_id);
    if (!vault) return;

    const document = await softDeleteDocumentById(id);

    if (!document) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Document not found" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { document };
  } catch (error) {
    console.error("deleteDocument error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to delete document" };
  }
};

export const getDocumentSignedUrlController = async (ctx: any) => {
  try {
    const { id } = ctx.params;
    const document = await getDocumentById(id);

    if (!document) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Document not found" };
      return;
    }

    const vault = await ensureVaultAccess(ctx, document.vault_id);
    if (!vault) return;

    const client = getSupabaseAdminClient();
    const bucket = getSupabaseBucket();

    const storagePath = coerceStoragePath(document.file_url, bucket);

    const { data, error } = await client.storage.from(bucket).createSignedUrl(storagePath, 60 * 10);
    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Failed to create signed URL");
    }

    try {
      const actorId = ctx.state.user?.id as string | undefined;
      if (actorId) {
        await createAuditLog({
          actor_id: actorId,
          action: "vault_document_signed_url",
          target_type: "vault_document",
          target_id: document.id,
          notes: JSON.stringify({ vault_id: document.vault_id }),
        });
      }
    } catch (e) {
      console.warn("Audit log failed (vault_document_signed_url):", e);
    }

    ctx.response.status = 200;
    ctx.response.body = { url: data.signedUrl };
  } catch (error) {
    console.error("getDocumentSignedUrl error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Failed to create signed URL" };
  }
};

export const createDocumentSignedUploadUrlController = async (ctx: any) => {
  try {
    const { vault_id } = ctx.params;
    if (!vault_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "vault_id is required" };
      return;
    }

    const vault = await ensureVaultAccess(ctx, vault_id);
    if (!vault) return;

    const body = await ctx.request.body.json().catch(() => ({}));
    const filename = typeof body?.filename === "string" ? body.filename : "";
    const contentType = typeof body?.content_type === "string" ? body.content_type : "application/octet-stream";

    if (!filename.trim()) {
      ctx.response.status = 400;
      ctx.response.body = { error: "filename is required" };
      return;
    }

    const bucket = getSupabaseBucket();
    const client = getSupabaseAdminClient();

    const safeFilename = sanitizeFilename(filename);
    const objectPath = `${vault_id}/${crypto.randomUUID()}_${safeFilename}`;

    // Supabase: signed upload URL (private bucket). Client uploads bytes directly to the signed URL.
    // The signed URL is time-limited and does not require public INSERT policies.
    const { data, error } = await client.storage.from(bucket).createSignedUploadUrl(objectPath);
    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Failed to create signed upload URL");
    }

    try {
      const actorId = ctx.state.user?.id as string | undefined;
      if (actorId) {
        await createAuditLog({
          actor_id: actorId,
          action: "vault_document_signed_upload_url",
          target_type: "vault",
          target_id: vault_id,
          notes: JSON.stringify({ path: objectPath, content_type: contentType }),
        });
      }
    } catch (e) {
      console.warn("Audit log failed (vault_document_signed_upload_url):", e);
    }

    ctx.response.status = 200;
    ctx.response.body = {
      path: data.path ?? objectPath,
      signed_url: data.signedUrl,
      token: data.token ?? null,
    };
  } catch (error) {
    console.error("createDocumentSignedUploadUrl error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Failed to create signed upload URL" };
  }
};
