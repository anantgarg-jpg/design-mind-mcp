import { cn } from "@/lib/utils"
import { Button } from "@blocks/Button/component"
import { ChevronRight } from "lucide-react"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/EntityRow/meta.yaml
// Safety:   safety/hard-constraints.md rule 10
// Density:  genome/rules/data-density.rule.md — scanning workflow, high throughput
// Taste:    genome/taste.md — density baseline 6, tabular-nums for score alignment
//
// STRUCTURAL CONSTRAINTS:
//   Empty fields show "—" not blank (safety rule 10).
//
// INVARIANTS (meta.yaml):
//   flex items-center gap-3 px-4 py-3.5
//   bg-card hover:bg-muted/50 (row separation is parent concern via divide-y)
//   border-l-2: warning for flagged/overdue, accent for active, transparent for neutral
//   Primary action: Button variant="outline" or "default" size="sm" h-7 text-sm
//   Score: tabular-nums for column alignment across rows

type Tier = "high" | "medium" | "low"
type BandLevel = 1 | 2 | 3 | 4

const TIER_CONFIG: Record<Tier, { label: string; className: string; dot: string }> = {
  // --destructive = Red
  high:   { label: "High", className: "text-destructive font-semibold", dot: "bg-destructive" },
  // --alert = Orange
  medium: { label: "Med",  className: "text-alert font-semibold",       dot: "bg-alert" },
  // neutral for low
  low:    { label: "Low",  className: "text-muted-foreground",           dot: "bg-border" },
}

// Avatar color derived from initials — stable across renders (not random)
const INITIALS_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-alert/10 text-alert",
  "bg-destructive/10 text-destructive",
]

interface EntityRowProps {
  initials: string
  name: string
  // Secondary context line — show "—" if unknown
  subtitle: string
  score: number
  trend?: "up" | "down" | "stable"
  tier: Tier
  band: BandLevel
  // Context-specific label (not generic "View")
  primaryAction: string
  primaryActionVariant?: "primary" | "outline"
  isOverdue?: boolean
  onPrimaryAction?: () => void
  onExpand?: () => void
  className?: string
}

export function EntityRow({
  initials,
  name,
  subtitle,
  score,
  trend = "stable",
  tier,
  band,
  primaryAction,
  primaryActionVariant = "primary",
  isOverdue,
  onPrimaryAction,
  onExpand,
  className,
}: EntityRowProps) {
  const tierConfig = TIER_CONFIG[tier]
  // Deterministic color from first initial — never random per render (meta.yaml key_rules)
  const colorIdx = initials.charCodeAt(0) % INITIALS_COLORS.length

  // Empty fields show "—" not blank
  const displaySubtitle = subtitle || "—"

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors cursor-default group",
      // Overdue/flagged left border accent — amber per meta.yaml key_rules
      isOverdue  ? "border-l-2 border-warning" : "border-l-2 border-transparent",
      className
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
        INITIALS_COLORS[colorIdx]
      )}>
        {initials}
      </div>

      {/* Name + subtitle — fills available space */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground leading-tight truncate">{name}</p>
        <p className="text-sm text-muted-foreground mt-1 truncate">{displaySubtitle}</p>
      </div>

      {/* Right columns — fixed-width group so score/band/CTA align across rows */}
      <div className="flex items-center gap-3 w-72 flex-shrink-0 self-center">
        {/* Score — tabular-nums for column alignment */}
        <div className="flex items-center gap-1 w-16 flex-shrink-0">
          <span className={cn("text-base tabular-nums", tierConfig.className)}>{score}</span>
          {trend === "up"   && <span className="text-destructive text-sm" aria-label="trending up">↑</span>}
          {trend === "down" && <span className="text-success text-sm"     aria-label="trending down">↓</span>}
        </div>

        {/* Band */}
        <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", tierConfig.dot)} aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Band {band}</span>
        </div>

        {/* Primary action — right-aligned */}
        <div className="flex-1 flex justify-end">
          <Button
            size="sm"
            variant={primaryActionVariant}
            onClick={onPrimaryAction}
          >
            {primaryAction}
          </Button>
        </div>
      </div>

      {/* Expand — visible on hover only */}
      {onExpand && (
        <Button
          variant="transparent"
          size="sm"
          iconOnly
          onClick={onExpand}
          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex-shrink-0"
          aria-label={`Expand ${name}`}
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
