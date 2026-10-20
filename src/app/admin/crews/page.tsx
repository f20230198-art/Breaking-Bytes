import { AdminCrews } from "@/components/admin/Crews";

export const instant = false; // admin-only and client-rendered: nothing to prerender

export default function Page() {
  return <AdminCrews />;
}
