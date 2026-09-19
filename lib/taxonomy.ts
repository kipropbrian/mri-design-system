/**
 * Portable domain vocabulary: how an MRI interface names a place and a
 * conservation status.
 *
 * This file is deliberately free of data. `lib/data.ts` reads the review site's
 * extracted JSON fixtures; everything here is the part that travels, so
 * `specimen-card` can be installed into another MRI project without dragging
 * `inat.json` and `birds.json` behind it. That was the whole reason
 * `specimen-card` was not portable.
 *
 * Status maps to a **chip tone**, never to a component variant, so the chip
 * system stays the only thing that decides how a tone renders and status colour
 * cannot drift page by page.
 */

export type IucnTone = "negative" | "warning" | "positive" | "neutral";

/** A country as the regional scope describes it. */
export interface RegionCountry {
  code: string;
  name: string;
  flag: string;
}

/**
 * One row of the East African checklist. The media counts are what the specimen
 * and media cards render, which is why the type lives with them rather than in a
 * fixture module.
 */
export interface BirdRecord {
  speciesCode: string;
  commonName: string;
  scientificName: string;
  family: string;
  familyScientific: string;
  order: string;
  authority: string | null;
  iucn: string;
  countries: string[];
  presenceCount: number;
  rwandaMatch: boolean;
  rwandaRank: number | null;
  rwandaFrequency: number | null;
  checklists: string[];
  photoCount: number;
  audioCount: number;
  videoCount: number;
  xenoCount: number;
  xenoCountryRecordings: Record<string, number>;
  image: string | null;
  ebirdUrl: string | null;
  xenocantoUrl: string | null;
  occurrenceScore: number;
  commonnessRank: number | null;
  range: string;
}

/** One iNaturalist "first record for a country" event. */
export interface CountryFirst {
  eventId: string;
  countryCode: string;
  countryName: string;
  scientificName: string;
  commonName: string | null;
  iconicTaxon: string;
  observationId: number;
  observationUrl: string;
  observer: string;
  observedOn: string;
  photoUrl: string;
  photoAttribution: string;
  photoLicense: string;
  supportCount: number;
  status: string;
  qualityGrade: string | null;
  globalFirst: boolean;
  globalObservationCount: number | null;
  detectedAt: string;
}

/**
 * IUCN status to chip tone. `EX` and `EW` share a tone with the threatened
 * categories because on a card the distinction that matters is "gone" versus
 * "at risk", and the label carries the precision.
 */
export const IUCN_TONE: Record<string, IucnTone> = {
  EX: "negative",
  EW: "negative",
  CR: "negative",
  EN: "negative",
  VU: "negative",
  NT: "warning",
  LC: "positive",
  DD: "neutral",
};

export const IUCN_LABEL: Record<string, string> = {
  CR: "Critically Endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near Threatened",
  LC: "Least Concern",
  DD: "Data Deficient",
  EX: "Extinct",
  EW: "Extinct in the Wild",
};

/**
 * `KE` -> `🇰🇪`, computed from the code rather than looked up in a table, so no
 * country list has to travel with it. The regional-indicator letters are a fixed
 * offset from A–Z, which is the entire trick.
 */
export function countryFlag(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65),
  );
}

/** Falls back to the raw code: an unknown status is shown, not hidden. */
export function iucnLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return IUCN_LABEL[status] ?? status;
}

export function iucnTone(status: string | null | undefined): IucnTone {
  if (!status) return "neutral";
  return IUCN_TONE[status] ?? "neutral";
}
