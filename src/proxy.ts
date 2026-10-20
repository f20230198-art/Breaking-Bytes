import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

// signed-in areas: no session → off to /login, then straight back here afterwards
const PRIVATE = ["/dashboard", "/admin", "/onboarding"];

export async function proxy(request: NextRequest) {
  const { user, response } = await refreshSession(request);
  const path = request.nextUrl.pathname;
  if (!user && PRIVATE.some((p) => path === p || path.startsWith(`${p}/`))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  return response();
}

export const config = {
  // skip static files and the (large) scene art; everything else keeps the session fresh
  matcher: ["/((?!_next/static|_next/image|scenes/|assets/|icon|favicon|.*\.(?:png|webp|jpg|jpeg|svg|ico|txt|xml)$).*)"],
};
