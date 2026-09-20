import Link from "next/link";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { Eyebrow, PageContainer } from "@/components/mri/layout";
import { EmptyState } from "@/components/mri/patterns";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer size="wide">
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
          <Link href="/" className={buttonVariants()}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to the overview
          </Link>
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
          <Link key={item.href} href={item.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {item.label}
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
