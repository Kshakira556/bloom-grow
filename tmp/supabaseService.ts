import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js";

let client: SupabaseClient | null = null;

export const getSupabaseAdminClient = () => {
  if (client) return client;

  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!url || !serviceKey) {
    throw new Error("Supabase admin is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  client = createClient(url, serviceKey);
  return client;
};

export const getSupabaseBucket = () => {
  return (Deno.env.get("SUPABASE_BUCKET") || "vault-documents").trim();
};

