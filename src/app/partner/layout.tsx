"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell";
import { useApp } from "@/lib/store";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const router = useRouter();
  const p = state.partners[0];
  const incoming = state.shipments.filter((s) => s.partnerId === p.id && s.status === "Planned" && s.notified && !s.accepted).length;
  return (
    <AppShell
      label="Partner portal" user={p.name} initials={p.name[0]} searchPlaceholder="Search batches or serials, then press Enter"
      onSearch={(q) => { if (q.trim()) router.push(`/partner/batches?q=${encodeURIComponent(q.trim())}`); }}
      nav={[
        { href: "/partner", label: "Incoming", count: incoming || undefined },
        { href: "/partner/batches", label: "Batches" },
        { href: "/partner/earnings", label: "Earnings" },
      ]}
    >
      {children}
    </AppShell>
  );
}
