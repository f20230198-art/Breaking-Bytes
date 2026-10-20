import { NextResponse, type NextRequest } from "next/server";
import { safeNext, siteOrigin } from "@/lib/safeNext";
import { supabaseServer } from "@/lib/supabase/server";

/** Google sends people back here with a one-time code; swap it for a session, then continue where they were headed. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = siteOrigin(request.headers, url.host, url.protocol.replace(":", ""));
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
