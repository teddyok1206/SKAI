import type { Metadata } from "next";
import Link from "next/link";
import { SkaiMark } from "@/components/skai-mark";
import { TopbarNav } from "@/components/topbar-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { UiModeSync } from "@/components/ui-mode-sync";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKAI",
  description: "AI orchestration practice, feedback, and sharing.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/skai-mark-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          <UiModeSync />
          <div className="app-shell">
            <header className="topbar">
              <div className="topbar-inner">
                <Link className="brand" href="/">
                  <span className="brand-mark" aria-hidden="true">
                    <SkaiMark size={22} />
                  </span>
                  <span>SKAI</span>
                </Link>
                <TopbarNav />
              </div>
            </header>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
