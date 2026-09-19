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
import type { BirdRecord, CountryFirst, RegionCountry } from "@/lib/taxonomy";

/**
 * The portable half of this vocabulary — the record types, the IUCN tables and
 * `countryFlag` — lives in `lib/taxonomy.ts` and is re-exported here so callers
 * keep a single import. Only the fixture-bound helpers are defined locally, which
 * is what lets `specimen-card` be installed without this file.
 */
export type { BirdRecord, CountryFirst, RegionCountry, IucnTone } from "@/lib/taxonomy";
export { IUCN_LABEL, IUCN_TONE, countryFlag, iucnLabel, iucnTone } from "@/lib/taxonomy";

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
