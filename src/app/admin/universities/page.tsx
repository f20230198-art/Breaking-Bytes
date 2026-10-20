import { AdminUniversities } from "@/components/admin/Tables";

export const instant = false; // admin-only and client-rendered: nothing to prerender

export default function Page() {
  return <AdminUniversities />;
}
