import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

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

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) {
    throw new Error("Supabase upload succeeded, but no public URL was returned.");
  }

  return publicUrl;
};
