import type { ReactNode } from "react";
import { LabProvider } from "@/components/dashboard/LabProvider";
import { Shell } from "@/components/dashboard/Shell";

export const metadata = { title: "The Lab · Breaking Bytes", robots: { index: false } };

// signed-in only (the proxy redirects otherwise); data loads client-side and every action is re-checked by the RPCs
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-ink">
      <LabProvider>
        <Shell>{children}</Shell>
      </LabProvider>
    </div>
  );
}
