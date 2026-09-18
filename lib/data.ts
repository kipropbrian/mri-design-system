/**
 * Typed access to the real MRI Platform slice extracted by
 * `scripts/extract-platform-data.mjs`.
 *
 * The JSON under `lib/data/` is regenerated from the live platform artifacts,
 * so the design system always reviews real shapes: real iNaturalist country
 * firsts, the real East African bird list, and real Xeno-canto coverage.
 */
import birdsJson from "@/lib/data/birds.json";
import inatJson from "@/lib/data/inat.json";

export interface CountrySummary {
  code: string;
  name: string;
  speciesCount: number;
  lastScanAt: string;
}

export interface WatchRun {
  runId: string;
  startedAt: string;
  completedAt: string;
  requestCount: number;
  newCount: number;
  recheckedCount: number;
  changedCount: number;
  promotedCount: number;
  withdrawnCount: number;
  stableRecheckedCount: number;
  status: string;
}

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

export interface TaxonShare {
  taxon: string;
  count: number;
  share: number;
}

export interface StatusShare {
  status: string;
  count: number;
}

export interface YearCount {
  year: number;
  count: number;
}

export interface InatData {
  source: string;
  publishedRunId: string;
  publishedAt: string;
  latestRun: WatchRun | null;
  runCount: number;
  eventCount: number;
  countries: CountrySummary[];
  runs: WatchRun[];
  taxa: TaxonShare[];
  statuses: StatusShare[];
  years: YearCount[];
  yearByCountry: {
    countries: { code: string; name: string }[];
    series: ({ year: number } & Record<string, number>)[];
  };
  taxaByCountry: {
    taxa: string[];
    rows: ({ code: string; name: string } & Record<string, number>)[];
  };
  events: CountryFirst[];
}

export const inat = inatJson as unknown as InatData;

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

export interface RegionCountry {
  code: string;
  name: string;
  flag: string;
}

export interface BirdData {
  source: string;
  totalSpecies: number;
  familyCount: number;
  /** Countries the checklist actually covers. */
  countries: RegionCountry[];
  /** The full regional scope, including countries outside the checklist. */
  region: RegionCountry[];
  byCountry: (RegionCountry & { species: number; withPhoto: number; withAudio: number })[];
  byFamily: { family: string; species: number; order: string }[];
  byChecklist: { source: string; species: number }[];
  byIucn: { status: string; species: number }[];
  presenceDistribution: { countries: number; species: number }[];
  mediaByFamily: { family: string; audio: number; photos: number; species: number }[];
  mediaTotals: {
    photos: number;
    audio: number;
    video: number;
    speciesWithMedia: number;
  };
  featured: BirdRecord[];
  rwandaTop: BirdRecord[];
  xeno: {
    totals: {
      recordings: number;
      speciesWithAudio: number;
      cataloguedSpecies: number;
    };
    byCountry: (RegionCountry & { recordings: number; species: number })[];
    topSpecies: BirdRecord[];
  };
}

export const birds = birdsJson as unknown as BirdData;

/** `KE` -> `{ name: "Kenya", flag: "🇰🇪" }` */
export const regionByCode = new Map<string, RegionCountry>(
  birds.region.map((country) => [country.code, country]),
);

export function countryLabel(code: string): string {
  return regionByCode.get(code)?.name ?? code;
}

export function countryFlag(code: string): string {
  return regionByCode.get(code)?.flag ?? "🏳️";
}

/**
 * IUCN status mapped to a chip tone, not to a component variant — the chip
 * system decides how a tone renders, so status colours cannot drift per page.
 */
export const IUCN_TONE: Record<
  string,
  "negative" | "warning" | "positive" | "neutral"
> = {
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
