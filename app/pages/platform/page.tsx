import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  CompassIcon,
  HeadphonesIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ProviderMark } from "@/components/site/brand";
import { Chip } from "@/components/mri/chips";
import { Eyebrow, PageContainer, SectionHeader } from "@/components/mri/layout";
import { Panel, SourceNote, StatusBadge } from "@/components/mri/patterns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { birds, inat } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Platform home",
  description:
    "The landing-page composition: hero with scope rail, weekly watch cards, and large field-tool cards with hero media.",
};

interface Watch {
  id: string;
  badge: string;
  badgeTone: "positive" | "info" | "warning";
  title: string;
  source: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  secondary: string;
  logo: string;
  action: string;
  href: string;
}

const WATCHES: Watch[] = [
  {
    id: "inat",
    badge: "Weekly species audit",
    badgeTone: "positive",
    title: "iNaturalist country firsts",
    source: "iNaturalist · Research grade",
    description:
      "Automated weekly detection of research-grade, photo-backed species records that are new to an East African country, with global-first records highlighted separately.",
    metricLabel: "Audit scope",
    metricValue: `${inat.countries.length} countries`,
    secondary: `${formatNumber(inat.eventCount)} verified records tracked`,
    logo: "/providers/inaturalist.png",
    action: "Explore country firsts",
    href: "/pages/inaturalist",
  },
  {
    id: "ebird",
    badge: "Weekly media watch",
    badgeTone: "info",
    title: "eBird & Macaulay watch",
    source: "Cornell Lab of Ornithology",
    description:
      "Regional monitor tracking new bird photos, audio and video, changes in species coverage, and the recordists producing the most verified media.",
    metricLabel: "Regional media",
    metricValue: `${formatCompact(birds.mediaTotals.photos + birds.mediaTotals.audio)} assets`,
    secondary: `${formatNumber(birds.mediaTotals.audio)} field audio recordings`,
    logo: "/providers/ebird.png",
    action: "View weekly highlights",
    href: "/pages/ebird",
  },
  {
    id: "xeno",
    badge: "Bioacoustic monitor",
    badgeTone: "warning",
    title: "Xeno-canto sound watch",
    source: "Xeno-canto archive",
    description:
      "Weekly tracking of wildlife sound recordings across East Africa, monitoring species audio gaps, mystery sounds and new field uploads.",
    metricLabel: "Sound archive",
    metricValue: `${formatCompact(birds.xeno.totals.recordings)} calls`,
    secondary: `${formatNumber(birds.xeno.totals.speciesWithAudio)} species with bioacoustic coverage`,
    logo: "/providers/xeno-canto.png",
    action: "Browse sound highlights",
    href: "/pages/xeno-canto",
  },
];

export default function PlatformHomePage() {
  return (
    <PageContainer size="wide">
      {/* ------------------------------------------------------------- hero */}
      <section className="grid gap-6 border-b border-border/60 pb-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
        <div className="grid gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-primary-ink">
              <CompassIcon className="size-3" weight="bold" />
              East Africa · Biodiversity updates
            </span>
          </div>

          <h1 className="text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            See what is changing across East Africa’s biodiversity.
          </h1>

          <p className="max-w-2xl text-pretty text-xs/relaxed text-muted-foreground sm:text-sm/relaxed">
            Each week Maiyo Research Institute reviews public biodiversity records from major platforms to
            identify species newly recorded in an East African country, new bird media and sound recordings,
            and gaps in regional coverage. We turn those changes into practical tools for researchers,
            fieldworkers and anyone learning about East Africa’s biodiversity.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button nativeButton={false} size="lg" render={<Link href="/pages/inaturalist" />}>
              Explore country firsts
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button nativeButton={false} size="lg" variant="outline" render={<Link href="/pages/quiz" />}>
              Practice bird sounds
            </Button>
          </div>
        </div>

        <Panel size="sm" title="At a glance" className="bg-muted/30">
          <dl className="grid gap-3">
            {[
              { term: "Regional coverage", value: `${inat.countries.length} East African countries` },
              { term: "Weekly monitoring", value: "New records, media & sounds", accent: true },
              { term: "Bird reference", value: `${formatNumber(birds.totalSpecies)}-species checklist` },
              { term: "Daily listening", value: "5 calls to identify" },
            ].map((row) => (
              <div key={row.term} className="grid gap-0.5 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <dt className="text-[0.6875rem] text-muted-foreground">{row.term}</dt>
                <dd
                  className={
                    row.accent
                      ? "text-xs/relaxed font-medium text-primary-ink"
                      : "text-xs/relaxed font-medium text-foreground"
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </section>

      {/* ---------------------------------------------------- weekly watches */}
      <section aria-labelledby="weekly-watches" className="grid gap-3">
        <SectionHeader
          eyebrow="Weekly biodiversity watches"
          title="What changed across East Africa"
          description="Weekly snapshots from iNaturalist, eBird/Macaulay and Xeno-canto compared into one regional view."
          id="weekly-watches"
        />

        <div className="grid gap-4 md:grid-cols-3">
          {WATCHES.map((watch) => (
            <Link
              key={watch.id}
              href={watch.href}
              className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full justify-between transition-colors group-hover:ring-primary/30">
                <div className="grid gap-3 px-(--card-spacing)">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge tone={watch.badgeTone}>{watch.badge}</StatusBadge>
                    <span className="grid size-7 place-items-center rounded-md bg-muted/60 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary-ink">
                      <ArrowUpRightIcon className="size-3.5" />
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted/50">
                      <ProviderMark src={watch.logo} alt={watch.source} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-sm font-medium text-foreground">
                        {watch.title}
                      </h3>
                      <p className="truncate text-[0.6875rem] text-muted-foreground">{watch.source}</p>
                    </div>
                  </div>

                  <p className="text-xs/relaxed text-muted-foreground">{watch.description}</p>
                </div>

                <div className="mt-4 grid gap-1.5 border-t border-border/60 px-(--card-spacing) pt-3">
                  <div className="flex items-baseline justify-between gap-2 text-xs/relaxed">
                    <span className="text-muted-foreground">{watch.metricLabel}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {watch.metricValue}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-muted-foreground">{watch.secondary}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-primary-ink group-hover:underline">
                    {watch.action}
                    <ArrowRightIcon className="size-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <hr className="border-border/60" />

      {/* --------------------------------------------------------- tools */}
      <section aria-labelledby="field-tools" className="grid gap-3">
        <SectionHeader
          eyebrow="Field & reference tools"
          title="Reference and sound practice for East Africa"
          description="Two long-form cards. Both lead with media, then icon, title, body, a short feature list and one primary action."
          id="field-tools"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="group gap-0 overflow-hidden p-0">
            <div className="relative aspect-[16/10] max-h-64 w-full overflow-hidden bg-muted">
              <img
                src="/quiz/forest-clearing-frame.webp"
                alt="Forest clearing at dawn — the field-recording setting used by the quiz"
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/85 via-foreground/45 to-transparent px-3 pt-10 pb-2 text-[0.625rem] text-background">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Nyungwe forest clearing</span>
                  <span className="text-background/85">Field recording · Rwanda</span>
                </div>
              </div>
            </div>

            <CardContent className="grid flex-1 content-between gap-4 py-(--card-spacing)">
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge tone="positive">Ear training & practice</StatusBadge>
                  <span className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Interactive
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary-ink">
                    <HeadphonesIcon className="size-4.5" weight="bold" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-heading text-base font-medium text-foreground">
                      East Africa bird quiz
                    </h3>
                    <p className="text-xs/relaxed text-primary-ink">
                      5 randomised daily calls · Field audio practice
                    </p>
                  </div>
                </div>

                <p className="text-xs/relaxed text-muted-foreground">
                  Test your ear against real field recordings from across East Africa. Listen, identify the
                  species among plausible regional candidates, and build recognition before heading outdoors.
                </p>

                <ul className="grid gap-1.5 border-t border-border/60 pt-3 text-[0.6875rem] text-muted-foreground">
                  {[
                    "Daily 5-challenge sound quizzes",
                    "Audio playback with regional variation",
                    "Personal streak and accuracy tracking",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <Button nativeButton={false} size="sm" render={<Link href="/pages/quiz" />}>
                  Play the quiz
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
                <SourceNote>Xeno-canto · 70,253 recordings</SourceNote>
              </div>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden p-0">
            <div className="relative aspect-[16/10] max-h-64 w-full overflow-hidden bg-muted">
              <img
                src={birds.featured[1]?.image ?? birds.featured[0].image ?? ""}
                alt={`${birds.featured[1]?.commonName ?? "East African bird"} — regional checklist reference`}
                loading="lazy"
                className="size-full object-cover object-[center_30%] transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/85 via-foreground/45 to-transparent px-3 pt-10 pb-2 text-[0.625rem] text-background">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{birds.featured[1]?.commonName}</span>
                  <span className="text-background/85">Photo · Macaulay Library</span>
                </div>
              </div>
            </div>

            <CardContent className="grid flex-1 content-between gap-4 py-(--card-spacing)">
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-2">
                  <Chip tone="notable">Regional checklist</Chip>
                  <span className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Authoritative reference
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary-ink">
                    <BookOpenIcon className="size-4.5" weight="bold" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-heading text-base font-medium text-foreground">
                      East African bird list
                    </h3>
                    <p className="text-xs/relaxed text-primary-ink">
                      Curated checklist · {birds.countries.length} nations unified
                    </p>
                  </div>
                </div>

                <p className="text-xs/relaxed text-muted-foreground">
                  A curated regional bird checklist sourced from eBird and reconciled against AviList
                  taxonomy. Filter by national presence, inspect residency status and follow verified
                  multimedia references.
                </p>

                <ul className="grid gap-1.5 border-t border-border/60 pt-3 text-[0.6875rem] text-muted-foreground">
                  {[
                    "eBird-sourced records with AviList taxonomy checks",
                    `Filter by ${birds.countries.length} East African nations`,
                    `${formatNumber(birds.familyCount)} families across ${formatNumber(birds.totalSpecies)} species`,
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <Button nativeButton={false} size="sm" render={<Link href="/pages/inaturalist" />}>
                  Browse the list
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
                <SourceNote>{formatNumber(birds.mediaTotals.speciesWithMedia)} species with media</SourceNote>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
        <SourceNote>
          Weekly watches compare published snapshots · latest {inat.publishedRunId} · {inat.runCount} runs
          recorded
        </SourceNote>
        <Eyebrow className="text-muted-foreground">Composition 01 · landing page</Eyebrow>
      </div>
    </PageContainer>
  );
}
