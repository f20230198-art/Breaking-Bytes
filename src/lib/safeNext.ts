/**
 * Where to send someone after signing in: a same-site path only. Anything else (another origin, protocol-relative
 * "//evil.com", "javascript:", backslash tricks) falls back to the dashboard. Used by the callback and the dev login.
 */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  return next && /^\/(?![\/\\])[\w\-./?=&%#~+]*$/.test(next) ? next : fallback;
}

/**
 * The site's public origin for redirects. The configured NEXT_PUBLIC_SITE_URL wins (production); without it (local
 * dev, LAN testing) the Host the browser used, since request.url holds the bind address (0.0.0.0) there.
 */
export function siteOrigin(headers: Headers, fallbackHost: string, fallbackProto: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = headers.get("host") ?? fallbackHost;
  return `${fallbackProto}://${host}`;
}
