/**
 * One choice-strip treatment replaces the two sizes and seven copied recipes that
 * made equivalent pickers disagree across the platform. Use it for a strip of
 * choices outside a card, such as country navigation or a parameter picker. A view
 * switch inside a card header's action slot remains `Button size="xs"` with the
 * secondary or ghost variant. Inside an item, secondary text is
 * `<span className="opacity-70">`; a country-code prefix is
 * `<span className="font-mono text-[0.6875rem] font-medium">`.
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";

/** The one look for every pick-one strip item: 24px tall, 12px text, primary fill when current. */
export function choiceItemClass(active: boolean): string {
  return cn(
    "inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
    active
      ? "bg-primary font-medium text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

/**
 * `nav` is for links; `group` is for buttons. A band sits under a page header with
 * a full-width rule and sideways scrolling, while an ordinary strip wraps.
 */
export function ChoiceStrip({
  label,
  kind = "group",
  band = false,
  className,
  children,
}: {
  label: string;
  kind?: "nav" | "group";
  band?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(
    band
      ? "flex w-full max-w-full min-w-0 items-center gap-1 overflow-x-auto border-b border-border py-1.5"
      : "flex w-full max-w-full min-w-0 flex-wrap items-center gap-1",
    className,
  );

  return kind === "nav" ? (
    <nav aria-label={label} className={classes}>
      {children}
    </nav>
  ) : (
    <div role="group" aria-label={label} className={classes}>
      {children}
    </div>
  );
}

/** A strip item that navigates. */
export function ChoiceLink({ active, className, ...props }: ComponentProps<typeof Link> & { active: boolean }) {
  return (
    <Link {...props} aria-current={active ? "page" : undefined} className={cn(choiceItemClass(active), className)} />
  );
}

/** A strip item that changes state on the page. */
export function ChoiceButton({
  active,
  className,
  ...props
}: Omit<ComponentProps<"button">, "type"> & { active: boolean }) {
  return <button {...props} type="button" aria-pressed={active} className={cn(choiceItemClass(active), className)} />;
}
