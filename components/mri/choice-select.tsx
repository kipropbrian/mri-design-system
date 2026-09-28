"use client";

/**
 * The phone presentation of a navigating choice strip: one native select.
 *
 * Ten countries do not fit a 360px row. Scrolled sideways they hid seven of the ten
 * behind a swipe nobody could see; wrapped they took four rows above the content. A
 * native select is one tap to the OS picker with every choice spelled out, and it is
 * what `ChoiceNav` renders below `sm`. Use `ChoiceNav` rather than this directly.
 */
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export type ChoiceNavItem = {
  href: string;
  label: string;
  /** A short code shown before the label, such as a country code. */
  prefix?: string;
  /** A trailing measure, such as a station count. */
  meta?: string;
};

export function ChoiceSelect({
  label,
  items,
  activeHref,
}: {
  label: string;
  items: readonly ChoiceNavItem[];
  activeHref?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex w-full min-w-0 flex-col gap-1">
      <span className="text-[0.625rem] font-medium text-muted-foreground">{label}</span>
      <NativeSelect
        value={activeHref ?? ""}
        aria-busy={pending || undefined}
        onChange={(event) => {
          const href = event.target.value;
          startTransition(() => router.push(href));
        }}
        // 36px tall and 16px text: iOS Safari zooms the page when a control under 16px
        // takes focus, and 36px is the touch-target floor.
        className="w-full [&_select]:h-9 [&_select]:text-base"
      >
        {activeHref ? null : (
          <NativeSelectOption value="" disabled>
            Choose…
          </NativeSelectOption>
        )}
        {items.map((item) => (
          <NativeSelectOption key={item.href} value={item.href}>
            {[item.prefix, item.label, item.meta].filter(Boolean).join(" · ")}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}
