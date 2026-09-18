import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { ReferenceNav } from "@/components/shell/reference-nav";
import { PageContainer } from "@/components/shell/layout";

export default function ReferencePagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-0">
      <div className="border-b border-border/60 bg-muted/30">
        <PageContainer size="wide" className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon className="size-3" />
              Design system
            </Link>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <p className="text-[0.6875rem] text-muted-foreground">
              Reference rebuilds · real data, preset-only styling
            </p>
          </div>
          <ReferenceNav />
        </PageContainer>
      </div>
      {children}
    </div>
  );
}
