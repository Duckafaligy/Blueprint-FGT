"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell";
import { useApp } from "@/lib/store";

export default function StaffLayout({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const router = useRouter();
  const qc = state.devices.filter((d) => d.status === "Ready for QC").length;
  const incoming = state.shipments.filter((s) => s.status === "Planned").length;
  return (
    <AppShell
      label="Operations" user="Sam · QC intern" initials="S" searchPlaceholder="Scan or type a serial, then press Enter"
      onSearch={(q) => { if (q.trim()) router.push(`/staff/devices?q=${encodeURIComponent(q.trim())}`); }}
      nav={[
        { href: "/staff", label: "Home" },
        { href: "/staff/bookings", label: "Bookings" },
        { href: "/staff/intake", label: "Intake" },
        { href: "/staff/wipe", label: "Wipe log" },
        { href: "/staff/partners", label: "Partners" },
        { href: "/staff/shipments", label: "Shipments", count: incoming || undefined },
        { href: "/staff/qc", label: "QC queue", count: qc || undefined },
        { href: "/staff/ready", label: "Ready to sell" },
        { href: "/staff/devices", label: "Devices" },
        { href: "/staff/people", label: "People" },
        { href: "/staff/settings", label: "Settings" },
      ]}
    >
      {children}
    </AppShell>
  );
}
