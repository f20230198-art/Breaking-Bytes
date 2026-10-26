/**
 * Whatever people paste ("github.com/walt", "@walt", "https://ae.linkedin.com/in/walt/?trk=x") becomes the one
 * canonical URL the database accepts (supabase/migrations/20261026120000_preregistration.sql). The server re-checks
 * the shape, so this only has to be friendly: empty stays empty, anything unrecognisable is passed through unchanged
 * for the server to reject with a clear message.
 */
const GITHUB_USER = /^[A-Za-z0-9](-?[A-Za-z0-9]){0,38}$/;
const LINKEDIN_SLUG = /^[A-Za-z0-9%_-]{3,300}$/;

function parse(raw: string) {
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

export function normaliseGithub(input: string) {
  const raw = input.trim();
  if (!raw) return "";
  const bare = raw.replace(/^@/, "");
  if (GITHUB_USER.test(bare)) return `https://github.com/${bare}`;
  const u = parse(raw);
  const user = u && /^(www\.)?github\.com$/i.test(u.hostname) ? u.pathname.split("/").filter(Boolean)[0] : null;
  return user && GITHUB_USER.test(user) ? `https://github.com/${user}` : raw;
}

export function normaliseLinkedin(input: string) {
  const raw = input.trim();
  if (!raw) return "";
  const u = parse(raw);
  // country and mobile subdomains (ae., in., m.) all point at the same profile
  const [kind, slug] = u && /^([a-z]{1,3}\.)?linkedin\.com$/i.test(u.hostname) ? u.pathname.split("/").filter(Boolean) : [];
  return kind === "in" && slug && LINKEDIN_SLUG.test(slug) ? `https://www.linkedin.com/in/${slug}` : raw;
}

export const githubOk = (url: string) => /^https:\/\/github\.com\//.test(url) && GITHUB_USER.test(url.slice(19));
export const linkedinOk = (url: string) => /^https:\/\/www\.linkedin\.com\/in\/[A-Za-z0-9%_-]{3,300}$/.test(url);
