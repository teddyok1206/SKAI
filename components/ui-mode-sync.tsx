"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type UiMode = "human" | "engine";

function modeFromPath(pathname: string): UiMode {
  if (pathname.startsWith("/problems")) {
    return "engine";
  }

  return "human";
}

export function UiModeSync() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.dataset.uiMode = modeFromPath(pathname);
  }, [pathname]);

  return null;
}
