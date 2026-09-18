import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { MriMark, MriMarkInverse } from "@/components/site/brand";
import { EXTERNAL_LINKS, FOOTER_GROUPS } from "@/components/site/nav";

export function SiteFooter() {
  const year = 2026;

  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:px-8">
        <div className="grid content-start gap-3">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid size-8 place-items-center rounded-md bg-background">
              <MriMark size={24} />
              <MriMarkInverse size={24} />
            </span>
            <span className="grid leading-tight">
              <span className="font-heading text-sm font-medium text-foreground">MRI Platform</span>
              <span className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Design system
              </span>
            </span>
          </Link>
          <p className="max-w-sm text-xs/relaxed text-muted-foreground">
            A shared interface language for MRI research tools, built on the shadcn preset{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.6875rem] text-foreground">
              b6t6Ah1yi
            </code>
            . Content sampled from live platform routes.
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">
            © {year} Maiyo Research Institute · Abundant, open, and accessible data
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} className="grid content-start gap-2" aria-label={group.title}>
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.title}
              </p>
              <ul className="grid gap-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-xs/relaxed text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav className="grid content-start gap-2" aria-label="Elsewhere">
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Elsewhere
            </p>
            <ul className="grid gap-1">
              {EXTERNAL_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1 text-xs/relaxed text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                    <ArrowUpRightIcon className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
