"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

/**
 * The scaffold ships a `d` hotkey for theme switching, which is handy while
 * building but invisible to a reviewer. This adds the visible control on top of
 * it.
 *
 * Both icons are always rendered and swapped by the `dark` class rather than by
 * component state, so there is no mount-gated render and no hydration mismatch.
 * `resolvedTheme` is read only inside the click handler.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle colour theme"
      title="Toggle theme (or press D)"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </Button>
  );
}
