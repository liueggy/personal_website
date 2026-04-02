"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PageTransitionShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition-shell">
      {children}
    </div>
  );
}
