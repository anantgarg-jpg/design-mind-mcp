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
//   Value: text-4xl font-medium tabular-nums leading-none (title/x-large)
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

// What this overrides: no shadcn component involved — applies text colour to the value <p>.
// Semantic tokens map variant intent to design-system colour vars. Never raw Tailwind colours.
// Renamed from VARIANT_CONFIG (nested shape) to VARIANT_CLASSES (flat Record<Variant, string>)
// to match the standard block override pattern.
const VARIANT_CLASSES: Record<StatVariant, string> = {
  default: "text-foreground",
  urgent:  "text-destructive",
  warning: "text-warning",
  success: "text-success",
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
        {/* TODO: replace text-4xl with a design token when a value size scale is added (was text-[32px]) */}
        <p className={cn("text-4xl font-medium tabular-nums leading-none", VARIANT_CLASSES[variant])}>
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
