import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/** Server client for server components, route handlers and server actions: acts as the signed-in user (RLS applies). */
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) jar.set(name, value, options);
        } catch {
          // called from a server component, where cookies are read-only; the proxy refreshes the session instead
        }
      },
    },
  });
}

/** The verified user (checked with the auth server, unlike getSession), or null. Use this for every auth decision. */
export async function currentUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
