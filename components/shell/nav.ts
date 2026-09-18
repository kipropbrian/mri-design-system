/**
 * Navigation for the design-template review app.
 *
 * `group: "template"` items are the design system itself (tokens, primitives,
 * data displays). `group: "reference"` items are full page compositions rebuilt
 * from live MRI Platform routes — they are the "higher level concepts" layered
 * on top of the preset.
 */
export interface NavItem {
  id: string;
  href: string;
  label: string;
  short: string;
  description: string;
  group: "template" | "reference";
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "nav-overview",
    href: "/",
    label: "Overview",
    short: "Overview",
    description: "What this template is and how to adopt it",
    group: "template",
  },
  {
    id: "nav-foundations",
    href: "/foundations",
    label: "Foundations",
    short: "Foundations",
    description: "Colour, type, radius, icons and the MRI mark",
    group: "template",
  },
  {
    id: "nav-rules",
    href: "/rules",
    label: "Rules",
    short: "Rules",
    description: "Space, chips and image overlays",
    group: "template",
  },
  {
    id: "nav-components",
    href: "/components",
    label: "Components",
    short: "Components",
    description: "The shadcn primitives exactly as the preset ships them",
    group: "template",
  },
  {
    id: "nav-charts",
    href: "/charts",
    label: "Charts",
    short: "Charts",
    description: "Chart containers, series colour and tooltip patterns",
    group: "template",
  },
  {
    id: "nav-patterns",
    href: "/patterns",
    label: "Page patterns",
    short: "Patterns",
    description: "Headers, metric strips, panels, tables and data states",
    group: "template",
  },
  {
    id: "nav-platform",
    href: "/pages/platform",
    label: "Platform home",
    short: "Platform",
    description: "Landing page: weekly watches and field tools",
    group: "reference",
  },
  {
    id: "nav-inaturalist",
    href: "/pages/inaturalist",
    label: "iNaturalist watch",
    short: "iNaturalist",
    description: "Country-first audit dashboard with records grid",
    group: "reference",
  },
  {
    id: "nav-ebird",
    href: "/pages/ebird",
    label: "eBird & Macaulay",
    short: "eBird",
    description: "Regional media dashboard with weekly highlights",
    group: "reference",
  },
  {
    id: "nav-xeno-canto",
    href: "/pages/xeno-canto",
    label: "Xeno-canto watch",
    short: "Xeno-canto",
    description: "Bioacoustic snapshot with country and taxa tables",
    group: "reference",
  },
  {
    id: "nav-quiz",
    href: "/pages/quiz",
    label: "Bird sound quiz",
    short: "Quiz",
    description: "Acoustic identification practice states",
    group: "reference",
  },
];

export const TEMPLATE_NAV = NAV_ITEMS.filter((item) => item.group === "template");
export const REFERENCE_NAV = NAV_ITEMS.filter((item) => item.group === "reference");

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function currentItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) => isActive(pathname, item.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}

/** Grouped links used by the footer. */
export const FOOTER_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Design system", items: TEMPLATE_NAV.filter((item) => item.href !== "/") },
  { title: "Reference pages", items: REFERENCE_NAV },
];

export const EXTERNAL_LINKS = [
  { label: "MRI platform", href: "https://platform.maiyoinstitute.org" },
  { label: "maiyoinstitute.org", href: "https://maiyoinstitute.org" },
  { label: "Documentation registry", href: "https://experiments.maiyoinstitute.org/wiki/concepts/mri-documentation-registry/" },
];
