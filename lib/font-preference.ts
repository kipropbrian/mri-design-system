/**
 * Font preference for the review build.
 *
 * **Inter leads** because the preset ships `font: inter` and the live platform
 * uses it. **Atkinson Hyperlegible is retained as the legibility fallback** —
 * the Braille Institute designed it for low-vision readers, an earlier MRI
 * prototype defaulted to it, and it stays available rather than being dropped.
 *
 * This store exists only so a reviewer can compare the shortlist live; it does
 * not change any preset token. The choice is applied by setting `data-font` on
 * `<html>` — see the review-only block at the end of `app/globals.css`.
 *
 * Implemented as an external store so the current value is read during render
 * (via `useSyncExternalStore`) rather than hydrated from an effect, which keeps
 * the server and client markup identical.
 */
export type FontKey = "inter" | "atkinson" | "geist" | "plex" | "source";

export interface FontOption {
  key: FontKey;
  label: string;
  variable: string;
  note: string;
  /** Present on the option that matches the live platform and the preset. */
  current?: boolean;
  /** Present on the option kept for a specific, stated reason. */
  fallback?: boolean;
}

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    key: "inter",
    label: "Inter",
    variable: "--font-inter",
    note: "Preset default · what the live platform uses",
    current: true,
  },
  {
    key: "atkinson",
    label: "Atkinson Hyperlegible",
    variable: "--font-atkinson",
    note: "Braille Institute · legibility fallback for low-vision reading",
    fallback: true,
  },
  {
    key: "geist",
    label: "Geist",
    variable: "--font-geist",
    note: "Vercel · tighter, more geometric",
  },
  {
    key: "plex",
    label: "IBM Plex Sans",
    variable: "--font-plex",
    note: "IBM · technical, institutional",
  },
  {
    key: "source",
    label: "Source Sans 3",
    variable: "--font-source",
    note: "Adobe · open, very high legibility",
  },
];

export const DEFAULT_FONT: FontKey = "inter";

const STORAGE_KEY = "mri-design-system-font";

const listeners = new Set<() => void>();
let cached: FontKey | null = null;

function isFontKey(value: unknown): value is FontKey {
  return FONT_OPTIONS.some((option) => option.key === value);
}

function readStored(): FontKey {
  if (typeof window === "undefined") return DEFAULT_FONT;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isFontKey(stored) ? stored : DEFAULT_FONT;
  } catch {
    return DEFAULT_FONT;
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): FontKey {
  if (cached === null) cached = readStored();
  return cached;
}

/** The server always renders the preset default, so markup matches on hydration. */
export function getServerSnapshot(): FontKey {
  return DEFAULT_FONT;
}

export function setFont(key: FontKey): void {
  cached = key;
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* private mode — the preview still switches for this session */
  }
  for (const listener of listeners) listener();
}

export function fontOption(key: FontKey): FontOption {
  return FONT_OPTIONS.find((option) => option.key === key) ?? FONT_OPTIONS[0];
}
