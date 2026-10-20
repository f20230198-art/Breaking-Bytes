import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** POST only, so a stray link or prefetch can never sign someone out. */
export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  // same Host-header origin as the callback (request.url is the bind address when listening on 0.0.0.0)
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return NextResponse.redirect(new URL("/", `${proto}://${host}`), { status: 303 });
}
