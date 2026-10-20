import { AdminOverview } from "@/components/admin/Overview";

export const instant = false; // admin-only and client-rendered: nothing to prerender

export default function Page() {
  return <AdminOverview />;
}
