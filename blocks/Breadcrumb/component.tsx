import { cn } from "@/lib/utils"
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Breadcrumb/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   text-sm text-muted-foreground for inactive items
//   / separator between levels
//   gap-1.5 between items
//   last item text-foreground (current page)

interface BreadcrumbSegment {
  label: string
  /** href for navigable segments; omit for the current page (last item) */
  href?: string
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[]
  /** Max visible segments before collapsing middle items (default 5) */
  maxVisible?: number
  className?: string
}

export function Breadcrumb({
  segments,
  maxVisible = 5,
  className,
}: BreadcrumbProps) {
  const shouldCollapse = segments.length > maxVisible
  const visibleSegments = shouldCollapse
    ? [segments[0], ...segments.slice(-(maxVisible - 2))]
    : segments

  return (
    <ShadcnBreadcrumb className={cn(className)}>
      <BreadcrumbList className="gap-1.5 text-sm">
        {visibleSegments.map((segment, index) => {
          const isLast = index === visibleSegments.length - 1
          const showEllipsis = shouldCollapse && index === 1

          return (
            <span key={segment.label} className="inline-flex items-center gap-1.5">
              {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
              {showEllipsis && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>/</BreadcrumbSeparator>
                </>
              )}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-foreground font-semibold">
                    {segment.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={segment.href}
                    className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {segment.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  )
}
