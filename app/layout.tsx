import type { Metadata } from "next";
import Link from "next/link";
import { Flame } from "lucide-react";
import { AuthStatus } from "@/components/auth-status";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKAI",
  description: "AI orchestration practice, feedback, and sharing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/">
                <span className="brand-mark" aria-hidden="true">
                  <Flame size={18} />
                </span>
                <span>SKAI</span>
              </Link>
              <nav className="nav" aria-label="Primary">
                <Link href="/">Problems</Link>
                <Link href="/admin">Admin</Link>
                <AuthStatus />
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
