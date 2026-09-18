import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Geist, IBM_Plex_Sans, Inter, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "cn";
import "./globals.css";

/**
 * Font stack.
 *
 * The preset specifies `font: inter`, which is what the live platform uses, so
 * Inter is the rendered default (`html { --font-sans: var(--font-inter) }` in
 * globals.css).
 *
 * Atkinson Hyperlegible is loaded as the **legibility fallback**: the Braille
 * Institute designed it for low-vision readers, and an earlier MRI prototype
 * defaulted to it. It is offered rather than dropped, but it does not lead.
 * The remaining three are the general shortlist. All five are swappable live
 * from the header — see `lib/font-preference.ts`.
 *
 * There is deliberately no webfont for `--font-mono`: the platform uses the
 * system monospace stack, and mono is only used here for codes and identifiers.
 */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});
const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "MRI design system",
    template: "%s · MRI design system",
  },
  description:
    "A shared MRI interface language built on shadcn preset b6t6Ah1yi — foundations, primitives, charts and page compositions sampled from live platform routes.",
  applicationName: "MRI design system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-font="inter"
      className={cn(
        "antialiased font-sans",
        inter.variable,
        atkinson.variable,
        geist.variable,
        plex.variable,
        source.variable,
      )}
    >
      <body className="flex min-h-svh flex-col bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider>
            <SiteHeader />
            <main id="main-content" className="min-w-0 flex-1">
              {children}
            </main>
            <SiteFooter />
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
