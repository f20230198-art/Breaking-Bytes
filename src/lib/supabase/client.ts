"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/** Browser client: anon key only. Every rule is enforced by RLS and the RPCs, never by this code. */
export function supabaseBrowser() {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
