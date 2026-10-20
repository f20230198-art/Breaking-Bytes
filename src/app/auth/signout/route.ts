import { NextResponse, type NextRequest } from "next/server";
import { siteOrigin } from "@/lib/safeNext";
import { supabaseServer } from "@/lib/supabase/server";

/** POST only, so a stray link or prefetch can never sign someone out. */
export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  const origin = siteOrigin(request.headers, request.nextUrl.host, request.nextUrl.protocol.replace(":", ""));
  return NextResponse.redirect(new URL("/", origin), { status: 303 });
}
