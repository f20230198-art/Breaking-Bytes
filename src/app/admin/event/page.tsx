import { AdminEvent } from "@/components/admin/Event";

export const instant = false; // admin-only and client-rendered: nothing to prerender

export default function Page() {
  return <AdminEvent />;
}
