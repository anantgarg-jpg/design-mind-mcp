import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Calendar } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type GapStatus = "open" | "in_outreach" | "closed" | "excluded"

const STATUS_CONFIG: Record<GapStatus, { label: string; className: string }> = {
  open:        { label: "Open",        className: "bg-[var(--warning-light)] text-warning border border-warning/30" },
  in_outreach: { label: "In Outreach", className: "bg-accent text-accent-foreground border border-accent-foreground/20" },
  closed:      { label: "Closed",      className: "bg-success/10 text-success border border-success/30" },
  excluded:    { label: "Excluded",    className: "bg-muted text-muted-foreground border border-border" },
}

interface CareGapRowProps {
  measureName: string
  measureCode?: string
  status: GapStatus
  dueDisplay: string
  isOverdue: boolean
  assignedTo?: string
  patientName?: string      // only shown outside patient context
  onCloseGap?: () => void
  onAssign?: () => void
  onExclude?: () => void
  className?: string
}

export function CareGapRow({
  measureName, measureCode, status, dueDisplay, isOverdue,
  assignedTo, patientName, onCloseGap, onAssign, onExclude, className,
}: CareGapRowProps) {
  const s = STATUS_CONFIG[status]
  const isActionable = status === "open" || status === "in_outreach"

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5",
      "border-b border-border/40 last:border-0",
      "hover:bg-muted/40 transition-colors group",
      !isActionable && "opacity-60",
      className
    )}>
      <div className="flex-1 min-w-0">
        {patientName && (
          <p className="text-xs text-muted-foreground leading-none mb-1">{patientName}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{measureName}</p>
          {measureCode && (
            <span className="font-mono text-xs text-muted-foreground">{measureCode}</span>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          <span className={cn(
            "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
            s.className
          )}>
            {s.label}
          </span>
          <span className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-warning font-medium" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" aria-hidden />
            {dueDisplay}
          </span>
          {assignedTo && (
            <span className="text-xs text-muted-foreground">{assignedTo}</span>
          )}
        </div>
      </div>

      {isActionable && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onCloseGap && (
            <Button variant="outline" size="sm" onClick={onCloseGap} className="h-7 text-xs">
              Close Gap
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              {onAssign && <DropdownMenuItem onClick={onAssign}>Assign</DropdownMenuItem>}
              {onExclude && <DropdownMenuItem onClick={onExclude} className="text-muted-foreground">Exclude</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
