import type { Metadata } from "next";
import {
  CheckCircleIcon,
  SealCheckIcon,
  InfoIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ChoiceDemos, DisclosureDemos, FeedbackDemos, OverlayDemos, TabDemos } from "@/components/site/component-demos";
import { PageContainer, PageHeader, SectionHeader, Specimen, SpecimenLabel } from "@/components/mri/layout";
import { EmptyState, MetricCardSkeleton, Panel, StatusBadge, TableSkeleton } from "@/components/mri/patterns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Kbd } from "@/components/ui/kbd";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { birds, inat } from "@/lib/data";
import { formatNumber, initials } from "@/lib/format";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Every shadcn primitive the preset installs, shown with the props the template actually uses.",
};

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;
const BADGE_VARIANTS = ["default", "secondary", "outline", "destructive", "ghost", "link"] as const;

export default function ComponentsPage() {
  const topCountries = inat.countries.slice(0, 5);
  const contributors = ["ksanderson", "bertogcliment", "brian_maish", "muthama", "jane_doe"];

  return (
    <PageContainer size="wide" className="grid gap-10 py-10 sm:py-10">
      <PageHeader
        eyebrow="Components"
        title="The shadcn primitives, as generated"
        description="These are the installed components with no local restyling. Every specimen below is the component itself, filled with MRI content so you can judge it against real data rather than placeholder strings."
        status={
          <>
            <StatusBadge tone="positive">37 primitives</StatusBadge>
            <Badge variant="outline">Base UI · style mira</Badge>
            <Badge variant="outline">Phosphor icons</Badge>
          </>
        }
      />

      <section className="grid gap-4">
        <SectionHeader eyebrow="Actions" title="Buttons" description="Six variants, four sizes, one focus treatment." />
        <Specimen label="button · variants" contentClassName="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {BUTTON_SIZES.map((size) => (
              <Button key={size} size={size}>
                size {size}
              </Button>
            ))}
            <Button size="icon-sm" aria-label="Icon button">
              <InfoIcon />
            </Button>
            <Button disabled>disabled</Button>
            <Button>
              <Spinner data-icon="inline-start" />
              Loading
            </Button>
          </div>
        </Specimen>

        <Specimen label="badge · variants and tones" contentClassName="flex flex-wrap items-center gap-2">
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
          <Separator orientation="vertical" className="mx-1 h-5" />
          <StatusBadge tone="positive" icon={<SealCheckIcon weight="fill" />}>
            Stable
          </StatusBadge>
          <StatusBadge tone="info">In progress</StatusBadge>
          <StatusBadge tone="negative">Withdrawn</StatusBadge>
          <StatusBadge tone="warning">Needs review</StatusBadge>
          <StatusBadge>Neutral</StatusBadge>
        </Specimen>
      </section>

      <section className="grid gap-4">
        <SectionHeader eyebrow="Containers" title="Cards" description="Default and small spacing, plus the media-first variant used across the platform." />
        <div className="grid gap-3 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Default card</CardTitle>
              <CardDescription>--card-spacing = 4 (1rem)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs/relaxed text-muted-foreground">
                Cards carry the page structure: metric strips, panels, tables and media grids are all cards.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                Card action
              </Button>
            </CardFooter>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Small card</CardTitle>
              <CardDescription>--card-spacing = 3 (0.75rem)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs/relaxed text-muted-foreground">
                Compact spacing is the default for dense regions such as metric strips.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card with action</CardTitle>
              <CardDescription>CardAction sits in the second grid column</CardDescription>
              <CardAction>
                <Badge variant="secondary">Latest</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-xs/relaxed text-muted-foreground">
                The header grid switches to two columns automatically once an action is present.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4">
        <SectionHeader eyebrow="Input" title="Forms and choices" description="Uncontrolled where the value is not needed, controlled where the UI reacts." />
        <Panel contentClassName="grid gap-4">
          <OverlayDemos />
          <Separator />
          <ChoiceDemos />
        </Panel>
      </section>

      <section className="grid gap-4">
        <SectionHeader eyebrow="Navigation" title="Tabs, breadcrumbs and pagination" />
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Tabs" description="Line and default variants share the same API">
            <TabDemos />
          </Panel>
          <Panel title="Breadcrumb" description="Always starts outside the app, at maiyoinstitute.org" contentClassName="grid gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="https://maiyoinstitute.org">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Platform</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/pages/inaturalist">iNaturalist</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Country first</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink>2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink>3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink>18</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </Panel>
        </div>
      </section>

      <section className="grid gap-4">
        <SectionHeader eyebrow="Disclosure" title="Accordion and collapsible" />
        <DisclosureDemos />
      </section>

      <section className="grid gap-4">
        <SectionHeader
          eyebrow="Data display"
          title="Tables and lists"
          description="Compact cells, monospace tabular numerals, semantic headers, horizontal containment rather than truncation."
        />
        <Panel
          title="National catalog distribution (8)"
          description="Species documented per monitored country"
          action={<Badge variant="outline">{formatNumber(birds.totalSpecies)} total</Badge>}
          contentClassName="grid gap-3"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="text-right">Species</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Share</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCountries.map((country) => (
                  <TableRow key={country.code}>
                    <TableCell className="font-medium text-foreground">{country.name}</TableCell>
                    <TableCell className="hidden font-mono text-[0.6875rem] text-muted-foreground sm:table-cell">
                      {country.code}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(country.speciesCount)}
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      <span className="inline-flex items-center justify-end gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.round((country.speciesCount / topCountries[0].speciesCount) * 100)}%`,
                            }}
                          />
                        </span>
                        <span className="w-9 text-right tabular-nums text-muted-foreground">
                          {Math.round((country.speciesCount / topCountries[0].speciesCount) * 100)}%
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={country.code === "BI" ? "positive" : "neutral"}>
                        {country.code === "BI" ? "Stable" : "Monitoring"}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                Country counts describe catalog documentation, not wildlife abundance.
              </TableCaption>
            </Table>
          </div>
        </Panel>

        <Panel title="Contributors (5)" description="Leading naturalists by verified records" contentClassName="grid gap-2">
          <ItemGroup>
            {contributors.map((name, index) => (
              <Item key={name} variant="outline" size="xs">
                <ItemMedia>
                  <span className="grid size-6 place-items-center rounded-full bg-muted font-mono text-[0.625rem] font-medium text-foreground">
                    {initials(name)}
                  </span>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">@{name}</ItemTitle>
                  <ItemDescription>
                    {formatNumber(320 - index * 47)} verified records
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant={index === 0 ? "default" : "outline"}>
                    {index === 0 ? "Top" : `#${index + 1}`}
                  </Badge>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </Panel>
      </section>

      <section className="grid gap-4">
        <SectionHeader eyebrow="Feedback" title="Alerts, progress and states" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Alert>
            <InfoIcon />
            <AlertTitle>Sample data</AlertTitle>
            <AlertDescription>
              Figures on this page come from a published platform snapshot, not a live query.
            </AlertDescription>
          </Alert>
          <Alert className="border-warning/40">
            <WarningIcon className="text-warning" />
            <AlertTitle>Coverage is not abundance</AlertTitle>
            <AlertDescription>
              A country with few records is under-documented, not necessarily species-poor.
            </AlertDescription>
          </Alert>
          <Alert className="border-primary/30">
            <CheckCircleIcon className="text-primary-ink" />
            <AlertTitle>Verified stable</AlertTitle>
            <AlertDescription>
              Confirmed with three or more agreeing expert identifications.
            </AlertDescription>
          </Alert>
        </div>

        <Panel contentClassName="grid gap-4">
          <FeedbackDemos />
          <Separator />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid content-start gap-3">
              <SpecimenLabel
                index="1"
                title="Metric card skeleton"
                description="Shares the exact geometry of the populated card"
              />
              <div className="grid grid-cols-2 gap-3">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </div>
            </div>
            <div className="grid content-start gap-3">
              <SpecimenLabel
                index="2"
                title="Table skeleton"
                description="Real table elements, equal row count, aria-busy on the wrapper"
              />
              <TableSkeleton rows={4} columns={4} label="Loading contributors" />
            </div>
          </div>
          <Separator />
          <div className="grid gap-3 lg:grid-cols-2">
            <EmptyState
              title="No matching country firsts"
              description="No records matched the current country, taxon and quality filters."
              action={<Button variant="outline" size="sm">Reset filters</Button>}
            />
            <div className="grid content-start gap-3">
              <SpecimenLabel index="3" title="Inline loading" description="Spinner and skeleton inside a live region" />
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" disabled>
                  <Spinner data-icon="inline-start" />
                  Syncing
                </Button>
                <span className="inline-flex items-center gap-2 text-[0.6875rem] text-muted-foreground">
                  <Skeleton className="h-3 w-24 rounded" />
                  rechecking 399 records
                </span>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground">
                Shortcut hints use <Kbd>K</Kbd> and <Kbd>⌘</Kbd> <Kbd>K</Kbd>.
              </p>
            </div>
          </div>
        </Panel>
      </section>
    </PageContainer>
  );
}
