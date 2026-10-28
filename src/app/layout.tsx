import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { DemoSidebar } from "@/components/shell";
import { Toasts } from "@/components/ui";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "FGT Flow demo",
  description: "From offer to sold: one app that follows every donated computer for Free Geek Toronto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <AppProvider>
          <div className="demo">
            <DemoSidebar />
            <div className="demo-main">{children}</div>
          </div>
          <Toasts />
        </AppProvider>
      </body>
    </html>
  );
}
