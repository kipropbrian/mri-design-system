"use client";

import { useEffect, useSyncExternalStore } from "react";
import { TextAaIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FONT_OPTIONS,
  fontOption,
  getServerSnapshot,
  getSnapshot,
  setFont,
  subscribe,
  type FontKey,
} from "@/lib/font-preference";

/**
 * Live font switcher for the review build.
 *
 * The active font is written to `data-font` on `<html>`; the review-only block
 * at the end of `globals.css` maps that attribute to `--font-sans`, so the whole
 * interface — headings, body, tables, charts — reflows at once. Writing the
 * attribute in an effect is a DOM side effect, not derived state, so there is
 * nothing to hydrate mismatched.
 */
export function FontPicker() {
  const activeKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const active = fontOption(activeKey);

  useEffect(() => {
    document.documentElement.dataset.font = activeKey;
  }, [activeKey]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 text-muted-foreground sm:inline-flex"
            aria-label={`Change interface font (currently ${active.label})`}
            title={`Interface font · ${active.label}`}
          />
        }
      >
        <TextAaIcon className="size-3.5" />
        <span className="font-medium">{active.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* Base UI's MenuGroupLabel requires group context, so the header lives
            inside the radio group rather than directly in the popup. */}
        <DropdownMenuRadioGroup
          value={activeKey}
          onValueChange={(value) => setFont(value as FontKey)}
        >
          <DropdownMenuLabel className="grid gap-0.5">
            <span>Interface font</span>
            <span className="text-[0.625rem] font-normal text-muted-foreground">
              Preview only — the preset ships font: inter
            </span>
          </DropdownMenuLabel>
          {FONT_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.key} value={option.key} className="items-start py-2">
              <span className="grid min-w-0 gap-0.5">
                <span
                  className="text-sm font-medium text-foreground"
                  style={{ fontFamily: `var(${option.variable})` }}
                >
                  {option.label}
                  {option.current ? (
                    <span className="ml-2 align-middle text-[0.625rem] font-normal text-primary-ink">
                      platform
                    </span>
                  ) : null}
                </span>
                <span className="text-[0.6875rem] text-muted-foreground">{option.note}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[0.625rem] leading-relaxed text-muted-foreground">
          Applies to headings, body copy, tables and charts. Your choice is remembered locally in this
          browser.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
