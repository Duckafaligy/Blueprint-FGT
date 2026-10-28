"use client";
import type { ReactNode } from "react";
import { FunnelShell } from "@/components/shell";
import "./business.css";

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return <FunnelShell><div className="biz">{children}</div></FunnelShell>;
}
