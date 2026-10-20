import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Google sends people back here with a one-time code; swap it for a session, then continue where they were headed. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin(request)));
  }
  return NextResponse.redirect(new URL("/login?error=auth", origin(request)));
}

// the address the browser actually used: request.url holds the bind address (0.0.0.0) when the server listens on
// every interface. Behind Railway's proxy the forwarded headers carry the public host and https.
function origin(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

// only same-site paths: never bounce someone to another origin after login
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
}
