import { cn } from "@/lib/utils"
import { Card } from "@blocks/Card/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/StatCard/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Taste:    genome/taste.md — numbers earn emphasis; tabular-nums for alignment
// Density:  genome/rules/data-density.rule.md — value scannable at a glance
//
// INVARIANTS:
//   Label: text-sm (12px) font-medium uppercase tracking-wide text-muted-foreground
//   Value: text-[32px] font-medium tabular-nums leading-none (title/x-large)
//   Max 4 StatCards per row.
//
// Container: Card block with elevation prop — no local card styling.
//
// Variant tokens map to semantic colors — never use Tailwind default colors.
//   urgent  → --destructive (Critical severity / highest-stakes data)
//   warning → --warning     (Overdue / at-risk)
//   success → --success     (Positive outcomes)
//   default → --foreground  (General counts, neutral)
// Subtitle is always text-muted-foreground — no reduced-opacity text.

type StatVariant = "default" | "urgent" | "warning" | "success"

const VARIANT_CONFIG: Record<StatVariant, { valueClass: string }> = {
  default: { valueClass: "text-foreground" },
  urgent:  { valueClass: "text-destructive" },
  warning: { valueClass: "text-warning" },
  success: { valueClass: "text-success" },
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
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={cn("text-[32px] font-medium tabular-nums leading-none", v.valueClass)}>
          {value}
        </p>
        {subtitle && (
          <p className="text-sm leading-4 text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  )
}
