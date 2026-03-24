import { cn } from "@/lib/utils"

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
  // onClick: makes the entire card interactive; hover state activates automatically
  onClick?: () => void
  className?: string
}

export function StatCard({
  label,
  value,
  subtitle,
  variant = "default",
  onClick,
  className,
}: StatCardProps) {
  const v = VARIANT_CONFIG[variant]

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "flex flex-col gap-1 p-4 bg-card rounded-lg border border-border/40 shadow-card",
        "transition-shadow",
        onClick && "cursor-pointer hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
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
  )
}
