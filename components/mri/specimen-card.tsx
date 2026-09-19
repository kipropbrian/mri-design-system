import {
  ArrowUpRightIcon,
  CameraIcon,
  GlobeIcon,
  MicrophoneIcon,
  SealCheckIcon,
  VideoCameraIcon,
  WaveformIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Chip, ChipRow, OverlayCaption } from "@/components/mri/chips";
import { Card, CardContent } from "@/components/ui/card";
import {
  countryFlag,
  IUCN_LABEL,
  IUCN_TONE,
  type BirdRecord,
  type CountryFirst,
} from "@/lib/taxonomy";
import { formatNumber } from "@/lib/format";
import { cn } from "cn";

/**
 * Specimen and media cards.
 *
 * These two cards are the reference implementation of the overlay rules:
 *
 * - The photograph bleeds to three edges; the body re-applies `--card-spacing`
 *   on all four, so nothing is ever flush.
 * - At most **two** chips sit on the image, one per top corner.
 * - Only media facts go on the image (where it was seen, how rare it is). Record
 *   facts — verification status, IUCN category, counts, dates — live in the body,
 *   because a chip on a photograph is unreadable the moment the photo is bright.
 */

const CHECKLIST_CODES = ["KE", "TZ", "UG", "RW", "BI", "CD", "SS", "SO"] as const;

/** IUCN category as a chip. Body only — never placed on a photograph. */
export function IucnChip({ status, className }: { status: string; className?: string }) {
  return (
    <Chip
      tone={IUCN_TONE[status] ?? "neutral"}
      title={`IUCN Red List: ${IUCN_LABEL[status] ?? status}`}
      className={className}
    >
      {status}
    </Chip>
  );
}

/**
 * Verification state. `monitoring` is the default state of a country first, so
 * it gets no chip at all — the absence of a Stable chip *is* the monitoring
 * signal, which is how the live platform reads.
 */
function VerificationChip({ status }: { status: string }) {
  if (status === "stable") {
    return (
      <Chip
        tone="positive"
        icon={<SealCheckIcon weight="fill" />}
        title="Stable record (3+ concurring IDs)"
      >
        Stable
      </Chip>
    );
  }
  if (status === "withdrawn") {
    return <Chip tone="negative">Withdrawn</Chip>;
  }
  return null;
}

export function ObservationCard({
  record,
  className,
}: {
  record: CountryFirst;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("group gap-0 overflow-hidden p-0", className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <a
          href={record.observationUrl}
          target="_blank"
          rel="noreferrer"
          className="block size-full"
          title={`View ${record.commonName ?? record.scientificName} on iNaturalist`}
        >
          <img
            src={record.photoUrl}
            alt={`${record.commonName ?? record.scientificName} observation`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </a>

        {/* Exactly two chips, one per corner, both carrying their own scrim. */}
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-1.5">
          <Chip
            surface="overlay"
            appearance="dark"
            title={record.countryName}
            icon={<span aria-hidden="true">{countryFlag(record.countryCode)}</span>}
          >
            {record.countryName}
          </Chip>
          {record.globalFirst ? (
            <Chip
              surface="overlay"
              appearance="highlight"
              icon={<GlobeIcon weight="bold" />}
              title="Earliest known observation of this species worldwide"
            >
              Global first
            </Chip>
          ) : null}
        </div>

        <OverlayCaption>{record.photoAttribution}</OverlayCaption>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 py-(--card-spacing)">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[0.625rem] font-medium uppercase tracking-[0.12em] text-primary-ink">
            {record.iconicTaxon}
          </p>
          <VerificationChip status={record.status} />
        </div>

        <div className="min-w-0">
          {/* When iNaturalist has no common name, the binomial carries the title
              and the italic line would just repeat it. */}
          <h3
            className={cn(
              "truncate text-sm font-medium text-foreground",
              record.commonName ? "font-heading" : "font-serif italic",
            )}
            title={record.commonName ?? record.scientificName}
          >
            {record.commonName ?? record.scientificName}
          </h3>
          {record.commonName ? (
            <p className="truncate font-serif text-xs italic text-muted-foreground">
              {record.scientificName}
            </p>
          ) : null}
        </div>

        {/* One metadata line: who, when, and how much agreement. */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-[0.6875rem]">
          <a
            href={record.observationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-primary-ink"
          >
            <span className="truncate">@{record.observer}</span>
            <ArrowUpRightIcon className="size-3 shrink-0" />
          </a>
          <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
            <span className="font-mono tabular-nums">{record.observedOn}</span>
            <span
              className="inline-flex items-center gap-1"
              title={`${record.supportCount} agreeing community identifications`}
            >
              <SealCheckIcon className="size-3" />
              <span className="font-medium tabular-nums text-foreground">{record.supportCount}</span>
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BirdMediaCard({ record, className }: { record: BirdRecord; className?: string }) {
  return (
    <Card size="sm" className={cn("group gap-0 overflow-hidden p-0", className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {record.image ? (
          <img
            src={record.image}
            alt={`${record.commonName} (${record.scientificName})`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center bg-muted/50 text-2xl" aria-hidden="true">
            🦜
          </div>
        )}
        {/* One chip: the media fact (which family this is). */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-center gap-1.5">
          <Chip surface="overlay" appearance="dark" title={`Family: ${record.family}`}>
            {record.family}
          </Chip>
        </div>
      </div>

      <CardContent className="grid flex-1 content-start gap-3 py-(--card-spacing)">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-sm font-medium text-foreground group-hover:text-primary-ink">
            {record.commonName}
          </h3>
          <p className="truncate font-serif text-xs italic text-muted-foreground">
            {record.scientificName}
          </p>
        </div>

        {/* Record facts live here, where the background is known. */}
        <ChipRow>
          <IucnChip status={record.iucn} />
          <Chip tone="neutral" title="Countries where this species is on the regional checklist">
            {record.presenceCount}/{CHECKLIST_CODES.length} countries
          </Chip>
        </ChipRow>

        <div className="flex items-center gap-3 border-t border-border/60 pt-3 text-[0.6875rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1" title="Catalogue photographs">
            <CameraIcon className="size-3" />
            <span className="tabular-nums text-foreground">{formatNumber(record.photoCount)}</span>
          </span>
          <span className="inline-flex items-center gap-1" title="Catalogue audio recordings">
            <MicrophoneIcon className="size-3" />
            <span className="tabular-nums text-foreground">{formatNumber(record.audioCount)}</span>
          </span>
          <span className="inline-flex items-center gap-1" title="Catalogue video clips">
            <VideoCameraIcon className="size-3" />
            <span className="tabular-nums text-foreground">{formatNumber(record.videoCount)}</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1" title="Xeno-canto recordings">
            <WaveformIcon className="size-3" />
            <span className="tabular-nums text-foreground">{formatNumber(record.xenoCount)}</span>
          </span>
        </div>

        {record.ebirdUrl ? (
          <a
            href={record.ebirdUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-between gap-1.5 rounded-md bg-muted/60 px-3 py-1.5 text-[0.6875rem] font-medium text-foreground transition-colors hover:bg-muted hover:text-primary-ink"
          >
            Open in eBird
            <ArrowUpRightIcon className="size-3" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
