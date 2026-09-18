"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { REFERENCE_NAV, isActive } from "@/components/shell/nav";
import { cn } from "cn";

/** Sub-navigation shown across the reference-page rebuilds. */
export function ReferenceNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Reference pages" className="flex flex-wrap items-center gap-1.5">
      {REFERENCE_NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1 text-xs/relaxed font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
