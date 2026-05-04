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

    const { data, error } = await client.storage.from(bucket).createSignedUrl(document.file_url, 60 * 10);
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
