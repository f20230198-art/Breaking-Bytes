/**
 * The RPCs (supabase/migrations/20261020120200_rpc.sql) raise short stable codes; this turns them into what a person
 * reads. Unknown errors fall back to a generic line rather than leaking database text.
 */
const MESSAGES: Record<string, string> = {
  not_signed_in: "Sign in first.",
  banned: "This account has been suspended. Talk to an organiser.",
  registration_closed: "Registration is closed.",
  rosters_frozen: "Crews are frozen now. Talk to an organiser to change yours.",
  already_in_crew: "You're already in a crew. Leave it first.",
  bad_name: "Crew names are 3–40 letters, numbers, spaces and . ' & ! ? _ -",
  name_taken: "That crew name is taken.",
  rate_limited: "Too many tries. Wait a minute and try again.",
  crew_locked: "That crew has locked its roster.",
  crew_full: "That crew is full.",
  not_in_crew: "You're not in a crew yet.",
  not_leader: "Only the crew leader can do that.",
  use_leave_team: "Use “Leave crew” to remove yourself.",
  not_member: "That person isn't in your crew.",
  disqualified: "This crew has been disqualified.",
  supplier_window_closed: "Suppliers can't be picked right now.",
  not_a_supplier: "That company isn't taking crews.",
  supplier_full: "That supplier is full. Pick another one.",
  problems_sealed: "Problem statements haven't dropped yet.",
  no_such_problem: "That problem doesn't exist.",
  wrong_supplier: "Pick a problem from your own supplier.",
  problem_full: "That problem is full.",
  problem_already_locked: "Your crew has already locked a problem.",
  submissions_closed: "The Dead Drop is closed.",
  bad_url: "Links must start with https://",
  notes_too_long: "Notes are limited to 2000 characters.",
  bad_display_name: "Names are 2–60 characters.",
  bad_phone: "That phone number doesn't look right.",
  bad_linkedin: "That LinkedIn link isn't a profile. It looks like linkedin.com/in/your-name.",
  bad_github: "That GitHub link isn't a profile. It looks like github.com/your-username.",
  need_a_link: "Add both your LinkedIn and GitHub.",
  link_taken: "Someone has already registered with that LinkedIn or GitHub. Use your own.",
  crew_accepted: "That crew is already accepted. Ask an organiser to add you.",
  not_accepted: "Your crew hasn't been accepted yet. Talk to an organiser.",
  not_admin: "Admins only.",
};

export function rpcMessage(error: { message?: string } | null | undefined) {
  if (!error) return null;
  return MESSAGES[error.message ?? ""] ?? "Something went wrong. Try again.";
}
