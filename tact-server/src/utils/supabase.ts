import { createClient } from "@supabase/supabase-js";
import { Context } from "hono";

export const getSupabaseClient = (c: Context) => {
  return createClient(c.env.SUPABASE_URL!, c.env.SUPABASE_SERVICE_ROLE_KEY!);
};
