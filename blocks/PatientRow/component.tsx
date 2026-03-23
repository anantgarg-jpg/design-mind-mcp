import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

type RiskTier = "high" | "medium" | "low"
type BandLevel = 1 | 2 | 3 | 4

const RISK_CONFIG: Record<RiskTier, { label: string; className: string; dot: string }> = {
  high:   { label: "High",   className: "text-destructive font-semibold", dot: "bg-destructive" },
  medium: { label: "Med",    className: "text-alert font-semibold",       dot: "bg-alert" },
  low:    { label: "Low",    className: "text-muted-foreground",          dot: "bg-border" },
}

interface PatientRowProps {
  initials: string
  name: string                          // Last, First format
  condition: string                     // e.g. "HbA1c overdue · 90 days"
  riskScore: number
  riskTrend?: "up" | "down" | "stable"
  riskTier: RiskTier
  band: BandLevel
  primaryAction: string                 // e.g. "Start Outreach", "Triage now"
  primaryActionVariant?: "default" | "outline"
  isOverdue?: boolean
  onPrimaryAction?: () => void
  onExpand?: () => void
  className?: string
}

const INITIALS_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-alert/10 text-alert",
  "bg-destructive/10 text-destructive",
]

export function PatientRow({
  initials, name, condition, riskScore, riskTrend = "stable",
  riskTier, band, primaryAction, primaryActionVariant = "default",
  isOverdue, onPrimaryAction, onExpand, className,
}: PatientRowProps) {
  const risk = RISK_CONFIG[riskTier]
  const colorIdx = initials.charCodeAt(0) % INITIALS_COLORS.length

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-default group",
      isOverdue && "border-l-2 border-warning",
      !isOverdue && "border-l-2 border-transparent",
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
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{condition}</p>
      </div>

      {/* Risk score */}
      <div className="flex items-center gap-1 w-16 flex-shrink-0">
        <span className={cn("text-sm tabular-nums", risk.className)}>{riskScore}</span>
        {riskTrend === "up" && <span className="text-destructive text-xs">↑</span>}
        {riskTrend === "down" && <span className="text-success text-xs">↓</span>}
      </div>

      {/* Band */}
      <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", risk.dot)} />
        <span className="text-xs text-muted-foreground">Band {band}</span>
      </div>

      {/* Primary action */}
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

      {/* Expand */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onExpand}
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  )
}
