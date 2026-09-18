import Link from "next/link";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { Eyebrow, PageContainer } from "@/components/shell/layout";
import { EmptyState } from "@/components/shell/patterns";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer size="wide" className="grid gap-6 py-10">
      <div className="grid gap-2">
        <Eyebrow>404 · Not found</Eyebrow>
        <h1 className="text-balance font-heading text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          That composition does not exist.
        </h1>
      </div>

      <EmptyState
        title="No such page in the design system"
        description="The route may have been renamed. Everything the template defines is reachable from the overview."
        action={
          <Button nativeButton={false} render={<Link href="/" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to the overview
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <MagnifyingGlassIcon className="size-3.5 text-muted-foreground" />
        {[
          { href: "/foundations", label: "Foundations" },
          { href: "/components", label: "Components" },
          { href: "/charts", label: "Charts" },
          { href: "/patterns", label: "Page patterns" },
          { href: "/pages/inaturalist", label: "iNaturalist watch" },
        ].map((item) => (
          <Button key={item.href} nativeButton={false} variant="outline" size="sm" render={<Link href={item.href} />}>
            {item.label}
          </Button>
        ))}
      </div>
    </PageContainer>
  );
}
