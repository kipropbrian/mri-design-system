"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, ListIcon } from "@phosphor-icons/react/dist/ssr";
import { BrandLink } from "@/components/site/brand";
import { FontPicker } from "@/components/site/font-picker";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS, REFERENCE_NAV, TEMPLATE_NAV, currentItem, isActive } from "@/components/site/nav";

function DesktopLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Template sections">
      {TEMPLATE_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-2 py-1 text-xs/relaxed font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
        >
          {item.short}
        </Link>
      ))}
      <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
      {REFERENCE_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-2 py-1 text-xs/relaxed font-medium text-muted-foreground/80 transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
        >
          {item.short}
        </Link>
      ))}
    </nav>
  );
}

function SheetGroup({ title, items, pathname }: { title: string; items: typeof NAV_ITEMS; pathname: string }) {
  return (
    <div className="grid gap-1">
      <p className="px-1 pb-1 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      {items.map((item) => (
        <SheetClose
          key={item.href}
          nativeButton={false}
          render={
            <Link
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className="group flex items-start justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted aria-[current=page]:bg-muted"
            />
          }
        >
          <span className="grid min-w-0 gap-0.5">
            <span className="text-xs/relaxed font-medium text-foreground">{item.label}</span>
            <span className="text-[0.6875rem] text-muted-foreground">{item.description}</span>
          </span>
          <ArrowUpRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </SheetClose>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const active = currentItem(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-xs/relaxed focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLink />
          {active ? (
            <Badge variant="outline" className="hidden xl:inline-flex">
              {active.label}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          <DesktopLinks pathname={pathname} />
          <span className="mx-1 hidden h-4 w-px bg-border lg:block" aria-hidden="true" />
          <FontPicker />
          <ThemeToggle />
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Open navigation" />}
            >
              <ListIcon />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,calc(100vw-1rem))] gap-0 p-0">
              <SheetHeader className="border-b border-border/60 p-4 pr-14">
                <SheetTitle>
                  <BrandLink subtitle="Design system" />
                </SheetTitle>
                <SheetDescription>
                  Sampled from live MRI Platform routes and rebuilt on the shadcn preset.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 overflow-y-auto p-4">
                <SheetGroup title="Design system" items={TEMPLATE_NAV} pathname={pathname} />
                <SheetGroup title="Reference pages" items={REFERENCE_NAV} pathname={pathname} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
