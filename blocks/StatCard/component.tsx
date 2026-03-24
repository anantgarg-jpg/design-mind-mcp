import { cn } from "@/lib/utils"
import { Card } from "@blocks/Card/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/StatCard/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Taste:    genome/taste.md — numbers earn emphasis; tabular-nums for alignment
// Density:  genome/rules/data-density.rule.md — value scannable at a glance
//
// INVARIANTS:
//   Label: text-sm (12px) font-semibold uppercase tracking-wide text-muted-foreground
//   Value: text-2xl font-semibold tabular-nums leading-none
//   Max 4 StatCards per row.
//
// Container: Card block with elevation prop — no local card styling.
//
// Variant tokens map to semantic colors — never use Tailwind default colors.
//   urgent  → --destructive (Critical severity / highest-stakes data)
//   warning → --warning     (Overdue / at-risk)
//   success → --success     (Positive outcomes)
//   default → --foreground  (General counts, neutral)

type StatVariant = "default" | "urgent" | "warning" | "success"

const VARIANT_CONFIG: Record<StatVariant, { valueClass: string; subtitleClass: string }> = {
  default: { valueClass: "text-foreground",          subtitleClass: "text-muted-foreground" },
  urgent:  { valueClass: "text-destructive",         subtitleClass: "text-destructive/70" },
  warning: { valueClass: "text-warning",             subtitleClass: "text-warning/70" },
  success: { valueClass: "text-success",             subtitleClass: "text-success/70" },
}

interface StatCardProps {
  label: string
  value: number | string
  // subtitle: supporting context — shown only when it adds meaning to the value
  subtitle?: string
  variant?: StatVariant
  elevation?: "flat" | "sm" | "md"
  // onClick: makes the entire card interactive; hover state activates automatically
  onClick?: () => void
  className?: string
}

export function StatCard({
  label,
  value,
  subtitle,
  variant = "default",
  elevation = "flat",
  onClick,
  className,
}: StatCardProps) {
  const v = VARIANT_CONFIG[variant]

  return (
    <Card
      elevation={elevation}
      onClick={onClick}
      className={className}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={cn("text-2xl font-semibold tabular-nums leading-none", v.valueClass)}>
          {value}
        </p>
        {subtitle && (
          <p className={cn("text-sm leading-tight", v.subtitleClass)}>
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  )
}
