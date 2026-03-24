import { cn } from "@/lib/utils"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/SectionHeader/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Density:  genome/rules/data-density.rule.md (wayfinding label, not a headline)
// Taste:    genome/taste.md — hierarchy through typography, not decoration
//
// INVARIANTS (never change):
//   text-sm (12px) font-semibold uppercase tracking-wider text-muted-foreground
//   Never bold or large — must recede visually, not dominate.
//   Count urgent/warning variants only when the count itself signals urgency.

interface SectionHeaderProps {
  title: string
  // count=0 renders (0 is a meaningful value, not empty — hard-constraint rule 10)
  count?: number
  countVariant?: "default" | "urgent" | "warning"
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({
  title,
  count,
  countVariant = "default",
  action,
  className,
}: SectionHeaderProps) {
  const countClass = {
    default: "text-muted-foreground",
    urgent:  "text-destructive font-semibold",
    warning: "text-warning font-semibold",
  }[countVariant]

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {/* count !== undefined: renders 0 (hard-constraint rule 10 — 0 is not blank) */}
        {count !== undefined && (
          <span className={cn("text-sm tabular-nums", countClass)}>
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
