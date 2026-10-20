import { AdminUsers } from "@/components/admin/Users";

export const instant = false; // admin-only and client-rendered: nothing to prerender

export default function Page() {
  return <AdminUsers />;
}
