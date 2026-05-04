import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) return supabaseClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
};

const sanitizeFileName = (name: string): string => {
  return name.replace(/[^\w.\-]+/g, "_");
};

export const uploadVaultDocument = async ({
  file,
  childId,
  vaultId,
}: {
  file: File;
  childId: string;
  vaultId: string;
}): Promise<string> => {
  const client = getSupabaseClient();
  const bucket = import.meta.env.VITE_SUPABASE_BUCKET || "vault-documents";
  const safeName = sanitizeFileName(file.name || "document");
  const path = `${childId}/${vaultId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  // For a private bucket we store the storage path, not a public URL.
  return path;
};

export const getSignedVaultDocumentUrl = async (
  fileUrlOrPath: string,
  expiresInSeconds = 60 * 10,
): Promise<string> => {
  const value = (fileUrlOrPath || "").trim();
  if (!value) throw new Error("Missing file reference");

  // Backwards compatible: previously stored full public URLs.
  if (/^https?:\/\//i.test(value)) return value;

  const client = getSupabaseClient();
  const bucket = import.meta.env.VITE_SUPABASE_BUCKET || "vault-documents";

  const { data, error } = await client.storage.from(bucket).createSignedUrl(value, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(`Supabase signed URL failed: ${error?.message || "Unknown error"}`);
  }

  return data.signedUrl;
};
