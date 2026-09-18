/**
 * Extracts a compact, reviewable slice of real MRI Platform data into
 * `lib/data/*.json` so the design system renders real content instead of
 * lorem ipsum.
 *
 * This is a *refresh* tool, not a build step: the JSON it writes is committed,
 * so a normal `npm ci && npm run build` never invokes it.
 *
 * The platform repo is located via `MRI_PLATFORM_ROOT`. It used to be derived
 * from this file's parent directory, which silently resolved to the wrong place
 * once the design system moved out of the platform repo — so the root is now
 * explicit and validated before anything is read.
 *
 * Sources (read-only):
 *   public/inaturalist/country-firsts/snapshots/inat-20260913.json
 *   public/birds/east-african-bird-list/east_african_bird_list.json
 *   public/birds/species-details/*.json
 *
 * Run from the mri-design-system directory:
 *   node scripts/extract-platform-data.mjs
 *   MRI_PLATFORM_ROOT=/path/to/platform node scripts/extract-platform-data.mjs
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PLATFORM_ROOT =
  "/Users/brian/Developer/MRI/platform/platform.maiyoinstitute.org";

const here = dirname(fileURLToPath(import.meta.url));
const designRoot = resolve(here, "..");
const platformRoot = resolve(process.env.MRI_PLATFORM_ROOT ?? DEFAULT_PLATFORM_ROOT);
const outDir = join(designRoot, "lib", "data");

/** The paths this script needs. Checked up front so a wrong root fails loudly. */
const REQUIRED = [
  "public/inaturalist/country-firsts/snapshots/inat-20260913.json",
  "public/birds/east-african-bird-list/east_african_bird_list.json",
  "public/birds/species-details",
];

const missing = REQUIRED.filter((rel) => !existsSync(join(platformRoot, rel)));
if (missing.length > 0) {
  console.error(`✗ MRI_PLATFORM_ROOT does not look like the platform repo: ${platformRoot}`);
  for (const rel of missing) console.error(`    missing ${rel}`);
  console.error("\nSet MRI_PLATFORM_ROOT to the platform checkout and re-run.");
  process.exit(1);
}
console.log(`platform root: ${platformRoot}`);

mkdirSync(outDir, { recursive: true });

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const write = (name, value) => {
  const target = join(outDir, name);
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
  const kb = (Buffer.byteLength(JSON.stringify(value)) / 1024).toFixed(0);
  console.log(`wrote ${name} (${kb} KB)`);
};

/* ------------------------------------------------------------------ iNaturalist */

const inatSnapshot = readJson(
  join(platformRoot, "public/inaturalist/country-firsts/snapshots/inat-20260913.json"),
);
const dash = inatSnapshot.dashboard;

const countryNames = new Map(dash.countries.map((c) => [c.country_code, c.country_name]));

const inatCountries = dash.countries
  .map((c) => ({
    code: c.country_code,
    name: c.country_name,
    speciesCount: c.species_count,
    lastScanAt: c.last_scan_at,
  }))
  .sort((a, b) => b.speciesCount - a.speciesCount);

const inatRuns = dash.runs
  .map((r) => ({
    runId: r.run_id,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    requestCount: r.request_count,
    newCount: r.new_count,
    recheckedCount: r.rechecked_count,
    changedCount: r.changed_count,
    promotedCount: r.promoted_count,
    withdrawnCount: r.withdrawn_count,
    stableRecheckedCount: r.stable_rechecked_count,
    status: r.status,
  }))
  .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

const events = dash.events ?? [];

const taxonCounts = new Map();
const statusCounts = new Map();
const yearCounts = new Map();
for (const e of events) {
  const taxon = e.iconic_taxon_name ?? "Unknown";
  taxonCounts.set(taxon, (taxonCounts.get(taxon) ?? 0) + 1);
  const status = e.status ?? "unknown";
  statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  const year = String(e.observed_on ?? "").slice(0, 4);
  if (year) yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
}

const taxonTotal = [...taxonCounts.values()].reduce((a, b) => a + b, 0);
const inatTaxa = [...taxonCounts.entries()]
  .map(([taxon, count]) => ({ taxon, count, share: taxonTotal ? count / taxonTotal : 0 }))
  .sort((a, b) => b.count - a.count);

const inatStatus = [...statusCounts.entries()]
  .map(([status, count]) => ({ status, count }))
  .sort((a, b) => b.count - a.count);

const inatYears = [...yearCounts.entries()]
  .map(([year, count]) => ({ year: Number(year), count }))
  .sort((a, b) => a.year - b.year);

/** Per-country observation-year series, capped at three countries to match the
 *  template's three-series chart rule (the olive ramp is monochrome). */
const topCountryCodes = [...inatCountries]
  .sort((a, b) => b.speciesCount - a.speciesCount)
  .slice(0, 3)
  .map((c) => c.code);
const yearByCountryMap = new Map();
for (const e of events) {
  const year = Number(String(e.observed_on ?? "").slice(0, 4));
  if (!year || !topCountryCodes.includes(e.country_code)) continue;
  const row = yearByCountryMap.get(year) ?? { year };
  row[e.country_code] = (row[e.country_code] ?? 0) + 1;
  yearByCountryMap.set(year, row);
}
const inatYearByCountry = [...yearByCountryMap.values()]
  .sort((a, b) => a.year - b.year)
  .map((row) => {
    const filled = { ...row };
    for (const code of topCountryCodes) filled[code] = filled[code] ?? 0;
    return filled;
  });

/** Country × iconic taxon matrix for the full event set (not just the cards).
 *  Four countries here — grouped bars stay legible with more categories than
 *  the three-series line chart. */
const taxaCountryCodes = [...inatCountries]
  .sort((a, b) => b.speciesCount - a.speciesCount)
  .slice(0, 4)
  .map((c) => c.code);
const taxaByCountryMap = new Map();
for (const e of events) {
  if (!taxaCountryCodes.includes(e.country_code)) continue;
  const row = taxaByCountryMap.get(e.country_code) ?? { code: e.country_code };
  const taxon = (e.iconic_taxon_name ?? "Unknown").toLowerCase();
  row[taxon] = (row[taxon] ?? 0) + 1;
  taxaByCountryMap.set(e.country_code, row);
}
const topTaxaKeys = inatTaxa
  .slice(0, 3)
  .map((t) => t.taxon.toLowerCase())
  .filter((taxon) => [...taxaByCountryMap.values()].some((row) => (row[taxon] ?? 0) > 0));
const taxaByCountry = taxaCountryCodes.map((code) => {
  const base = taxaByCountryMap.get(code) ?? { code };
  const row = { code, name: countryNames.get(code) ?? code };
  for (const taxon of topTaxaKeys) row[taxon] = base[taxon] ?? 0;
  return row;
});

/** Prefer photogenic, taxonomically varied, multi-country records for the card grid. */
const withPhoto = events.filter((e) => e.photo_url && e.country_code);
const seenTaxa = new Map();
const seenCountry = new Map();
const picked = [];
for (const e of withPhoto) {
  const taxon = e.iconic_taxon_name ?? "Unknown";
  const taxaUsed = seenTaxa.get(taxon) ?? 0;
  const countryUsed = seenCountry.get(e.country_code) ?? 0;
  if (taxaUsed >= 3 || countryUsed >= 4) continue;
  if (picked.some((p) => p.species_taxon_id === e.species_taxon_id)) continue;
  seenTaxa.set(taxon, taxaUsed + 1);
  seenCountry.set(e.country_code, countryUsed + 1);
  picked.push(e);
  if (picked.length >= 12) break;
}

const inatEvents = picked.map((e) => ({
  eventId: e.event_id,
  countryCode: e.country_code,
  countryName: e.country_name ?? countryNames.get(e.country_code) ?? e.country_code,
  scientificName: e.scientific_name,
  commonName: e.common_name ?? null,
  iconicTaxon: e.iconic_taxon_name ?? "Unknown",
  observationId: e.observation_id,
  observationUrl: e.observation_url,
  observer: e.observer_login,
  observedOn: e.observed_on,
  photoUrl: e.photo_url,
  photoAttribution: e.photo_attribution,
  photoLicense: e.photo_license_code,
  supportCount: e.support_count,
  status: e.status,
  qualityGrade: e.current_quality_grade ?? null,
  globalFirst: Boolean(e.global_first && e.global_first.status === "confirmed"),
  globalObservationCount: e.global_first?.global_observation_count ?? null,
  detectedAt: e.detected_at,
}));

write("inat.json", {
  source: "public/inaturalist/country-firsts/snapshots/inat-20260913.json",
  publishedRunId: inatSnapshot.published_run_id,
  publishedAt: inatSnapshot.published_at,
  latestRun: inatRuns.at(-1) ?? null,
  runCount: inatRuns.length,
  eventCount: events.length,
  countries: inatCountries,
  runs: inatRuns,
  taxa: inatTaxa,
  statuses: inatStatus,
  years: inatYears,
  yearByCountry: {
    countries: topCountryCodes.map((code) => ({
      code,
      name: countryNames.get(code) ?? code,
    })),
    series: inatYearByCountry,
  },
  taxaByCountry: { taxa: topTaxaKeys, rows: taxaByCountry },
  events: inatEvents,
});

/* ------------------------------------------------------------------------- Birds */

const birdList = readJson(
  join(platformRoot, "public/birds/east-african-bird-list/east_african_bird_list.json"),
);
const speciesDetailDir = join(platformRoot, "public/birds/species-details");
const detailByCode = new Map();
for (const file of readdirSync(speciesDetailDir)) {
  if (!file.endsWith(".json")) continue;
  try {
    const detail = readJson(join(speciesDetailDir, file));
    if (detail?.speciesCode) detailByCode.set(detail.speciesCode, detail);
  } catch {
    /* ignore malformed scratch files */
  }
}

const birds = Object.values(birdList).map((b) => {
  const detail = detailByCode.get(b.species_code);
  const countryRecordings = detail?.xenoCantoCountryRecordings ?? b.xeno_canto_country_recordings ?? {};
  return {
    speciesCode: b.species_code,
    commonName: b.common_name,
    scientificName: b.scientific_name,
    family: b.family_name,
    familyScientific: b.family_scientific_name,
    order: b.order_name,
    authority: b.authority || null,
    iucn: b.iucn_status,
    countries: b.countries ?? [],
    presenceCount: b.presence_count ?? (b.countries ?? []).length,
    rwandaMatch: Boolean(b.rwanda_match),
    rwandaRank: b.rwanda_rank ?? null,
    rwandaFrequency: b.rwanda_frequency ?? null,
    checklists: b.checklists ?? [],
    photoCount: b.ebird_media_photo_count ?? 0,
    audioCount: b.ebird_media_audio_count ?? 0,
    videoCount: b.ebird_media_video_count ?? 0,
    xenoCount: detail?.xenoCantoRecordingCount ?? b.xeno_canto_recording_count ?? 0,
    xenoCountryRecordings: countryRecordings,
    image: detail?.primaryImage || b.ebird_media_image_url || null,
    ebirdUrl: b.ebird_url ?? null,
    xenocantoUrl: b.xenocanto_url ?? null,
    occurrenceScore: b.occurrence_score ?? 0,
    commonnessRank: b.ebird_commonness_rank ?? null,
    range: detail?.range || b.range_text || "",
  };
});

const groupCount = (items, keyFn) => {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (key === null || key === undefined || key === "") continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
};

const EAST_AFRICA = [
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "CD", name: "DR Congo", flag: "🇨🇩" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
];

// The checklist covers eight of the nine regional countries; Ethiopia is not
// in scope, so it must not appear as a zero bar in any chart.
const birdsByCountry = EAST_AFRICA.map((c) => {
  const inCountry = birds.filter((b) => b.countries.includes(c.code));
  return {
    ...c,
    species: inCountry.length,
    withPhoto: inCountry.filter((b) => b.photoCount > 0).length,
    withAudio: inCountry.filter((b) => b.audioCount > 0).length,
  };
}).filter((c) => c.species > 0);

const byChecklist = groupCount(birds, (b) =>
  b.checklists?.includes("ebird") && b.checklists?.includes("bubo")
    ? "eBird + Bubo"
    : b.checklists?.includes("ebird")
      ? "eBird only"
      : b.checklists?.includes("bubo")
        ? "Bubo only"
        : "Unlisted",
).map(({ key, count }) => ({ source: key, species: count }));

const birdsByFamily = groupCount(birds, (b) => b.family)
  .slice(0, 12)
  .map(({ key, count }) => ({
    family: key,
    species: count,
    order: birds.find((b) => b.family === key)?.order ?? "",
  }));

const birdsByIucn = groupCount(birds, (b) => b.iucn).map(({ key, count }) => ({
  status: key,
  species: count,
}));

const presenceDistribution = groupCount(birds, (b) => String(b.presenceCount))
  .map(({ key, count }) => ({ countries: Number(key), species: count }))
  .sort((a, b) => a.countries - b.countries);

const byImage = birds.filter((b) => b.image);

/** Media volume by family — real variance, so it reads well as a grouped bar. */
const mediaByFamily = groupCount(
  birds.filter((b) => b.audioCount > 0),
  (b) => b.family,
)
  .slice(0, 8)
  .map(({ key }) => {
    const family = birds.filter((b) => b.family === key);
    return {
      family: key,
      audio: family.reduce((sum, b) => sum + b.audioCount, 0),
      photos: family.reduce((sum, b) => sum + b.photoCount, 0),
      species: family.length,
    };
  })
  .sort((a, b) => b.audio - a.audio);
const featured = [...byImage]
  .filter((b) => b.presenceCount >= 5)
  .sort((a, b) => b.occurrenceScore - a.occurrenceScore)
  .slice(0, 8);

const xenoTop = [...byImage]
  .sort((a, b) => b.xenoCount - a.xenoCount)
  .slice(0, 8);

const rwandaTop = birds
  .filter((b) => b.rwandaMatch && b.rwandaFrequency !== null)
  .sort((a, b) => (b.rwandaFrequency ?? 0) - (a.rwandaFrequency ?? 0))
  .slice(0, 8);

const xenoCountryTotals = new Map();
const xenoCountrySpecies = new Map();
for (const b of birds) {
  for (const [code, recordings] of Object.entries(b.xenoCountryRecordings ?? {})) {
    const n = Number(recordings) || 0;
    xenoCountryTotals.set(code, (xenoCountryTotals.get(code) ?? 0) + n);
    xenoCountrySpecies.set(code, (xenoCountrySpecies.get(code) ?? 0) + 1);
  }
}
const xenoByCountry = EAST_AFRICA.map((c) => ({
  ...c,
  recordings: xenoCountryTotals.get(c.code) ?? 0,
  species: xenoCountrySpecies.get(c.code) ?? 0,
})).sort((a, b) => b.recordings - a.recordings);

const xenoTotals = {
  recordings: birds.reduce((sum, b) => sum + b.xenoCount, 0),
  speciesWithAudio: birds.filter((b) => b.xenoCount > 0).length,
  cataloguedSpecies: birds.length,
};

const mediaTotals = {
  photos: birds.reduce((sum, b) => sum + b.photoCount, 0),
  audio: birds.reduce((sum, b) => sum + b.audioCount, 0),
  video: birds.reduce((sum, b) => sum + b.videoCount, 0),
  speciesWithMedia: birds.filter((b) => b.photoCount + b.audioCount + b.videoCount > 0).length,
};

write("birds.json", {
  source: "public/birds/east-african-bird-list/east_african_bird_list.json + public/birds/species-details/",
  totalSpecies: birds.length,
  familyCount: new Set(birds.map((b) => b.family)).size,
  // `region` is the full nine-country scope; `countries` is what the checklist
  // actually covers (Ethiopia is not in the eBird regional list).
  region: EAST_AFRICA,
  countries: birdsByCountry.map(({ code, name, flag }) => ({ code, name, flag })),
  byCountry: birdsByCountry,
  byFamily: birdsByFamily,
  byChecklist,
  byIucn: birdsByIucn,
  presenceDistribution,
  mediaByFamily,
  mediaTotals,
  featured,
  rwandaTop,
  xeno: {
    totals: xenoTotals,
    byCountry: xenoByCountry,
    topSpecies: xenoTop,
  },
});

console.log("done");
