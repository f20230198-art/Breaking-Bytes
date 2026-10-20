import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Gus's Office · Breaking Bytes", robots: { index: false } };

// signed-in only (proxy); admin-only is enforced by the database on every read and write
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
