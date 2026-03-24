import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/PatientRow/meta.yaml
// Ontology: ontology/entities.yaml → Patient, Provider
// Safety:   safety/hard-constraints.md rules 7, 10
// Density:  genome/rules/data-density.rule.md — scanning workflow, high throughput
// Taste:    genome/taste.md — density baseline 6, tabular-nums for risk score alignment
//
// HARD CONSTRAINTS:
//   Rule 7:  Name always "Last, First". Never first name only.
//   Rule 10: Empty fields show "—" not blank.
//
// INVARIANTS (meta.yaml):
//   flex items-center gap-3 px-4 py-3.5
//   border-b border-border/40 last:border-0 bg-card hover:bg-muted/50
//   border-l-2: warning for overdue, accent for active, transparent for neutral
//   Primary action: Button variant="outline" or "default" size="sm" h-7 text-xs
//   Risk score: tabular-nums for column alignment across rows

type RiskTier = "high" | "medium" | "low"
type BandLevel = 1 | 2 | 3 | 4

const RISK_CONFIG: Record<RiskTier, { label: string; className: string; dot: string }> = {
  // --destructive = MDS Red
  high:   { label: "High", className: "text-destructive font-semibold", dot: "bg-destructive" },
  // --alert = MDS Orange
  medium: { label: "Med",  className: "text-alert font-semibold",       dot: "bg-alert" },
  // neutral for low risk
  low:    { label: "Low",  className: "text-muted-foreground",           dot: "bg-border" },
}

// Avatar color derived from initials — stable across renders (not random)
const INITIALS_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-alert/10 text-alert",
  "bg-destructive/10 text-destructive",
]

interface PatientRowProps {
  initials: string
  // Name in "Last, First" format — hard-constraint rule 7
  name: string
  // Context string e.g. "HbA1c overdue · 90 days" — show "—" if unknown
  condition: string
  riskScore: number
  riskTrend?: "up" | "down" | "stable"
  riskTier: RiskTier
  band: BandLevel
  // Context-specific label (not generic "View") — e.g. "Start Outreach", "Triage"
  primaryAction: string
  primaryActionVariant?: "default" | "outline"
  isOverdue?: boolean
  onPrimaryAction?: () => void
  onExpand?: () => void
  className?: string
}

export function PatientRow({
  initials,
  name,
  condition,
  riskScore,
  riskTrend = "stable",
  riskTier,
  band,
  primaryAction,
  primaryActionVariant = "default",
  isOverdue,
  onPrimaryAction,
  onExpand,
  className,
}: PatientRowProps) {
  const risk = RISK_CONFIG[riskTier]
  // Deterministic color from first initial — never random per render (meta.yaml key_rules)
  const colorIdx = initials.charCodeAt(0) % INITIALS_COLORS.length

  // hard-constraint rule 10: empty condition shows "—" not blank
  const displayCondition = condition || "—"

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-default group",
      // Overdue left border accent — amber per meta.yaml key_rules
      isOverdue  ? "border-l-2 border-warning" : "border-l-2 border-transparent",
      className
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
        INITIALS_COLORS[colorIdx]
      )}>
        {initials}
      </div>

      {/* Name + condition */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{displayCondition}</p>
      </div>

      {/* Risk score — tabular-nums for column alignment */}
      <div className="flex items-center gap-1 w-16 flex-shrink-0">
        <span className={cn("text-sm tabular-nums", risk.className)}>{riskScore}</span>
        {riskTrend === "up"   && <span className="text-destructive text-xs" aria-label="trending up">↑</span>}
        {riskTrend === "down" && <span className="text-success text-xs"     aria-label="trending down">↓</span>}
      </div>

      {/* Band */}
      <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", risk.dot)} aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Band {band}</span>
      </div>

      {/* Primary action — label must be context-specific, never generic "View" */}
      <div className="flex-shrink-0">
        <Button
          size="sm"
          variant={primaryActionVariant}
          onClick={onPrimaryAction}
          className="h-7 text-xs"
        >
          {primaryAction}
        </Button>
      </div>

      {/* Expand — visible on hover only */}
      {onExpand && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpand}
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          aria-label={`Expand ${name}`}
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
