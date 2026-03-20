import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge, type StatusKey } from "@/components/StatusBadge"
import { Calendar, User, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Status values from ontology/states.yaml CareGapStatus
// Action labels from ontology/actions.yaml
// Never rename actions — use canonical labels exactly

interface CareGapCardProps {
  measureName: string
  measureCode?: string
  status: "open" | "in_outreach" | "closed" | "excluded"
  dueDate: string           // ISO date string
  dueDateDisplay: string    // Formatted: "Jan 5, 2025" or "2 days ago"
  isOverdue: boolean
  assignedTo?: string
  patientName?: string      // shown when used outside patient context
  onCloseGap?: () => void
  onAssign?: () => void
  onAddNote?: () => void
  onExclude?: () => void
  className?: string
}

export function CareGapCard({
  measureName,
  measureCode,
  status,
  dueDate,
  dueDateDisplay,
  isOverdue,
  assignedTo,
  patientName,
  onCloseGap,
  onAssign,
  onAddNote,
  onExclude,
  className,
}: CareGapCardProps) {
  const isActionable = status === "open" || status === "in_outreach"
  const isClosed = status === "closed" || status === "excluded"

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 p-4",
        "bg-card border border-border/60 rounded-lg shadow-card",
        "hover:shadow-card-hover transition-shadow",
        isClosed && "opacity-50",
        className
      )}
    >
      {/* Left: measure info */}
      <div className="flex-1 min-w-0">
        {patientName && (
          <p className="text-xs text-muted-foreground mb-1">{patientName}</p>
        )}
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">
              {measureName}
            </p>
            {measureCode && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {measureCode}
              </p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-2">
          <StatusBadge status={status as StatusKey} size="sm" />

          <span className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-warning font-medium" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" aria-hidden="true" />
            {/* Due date copy from ontology/copy-voice.md */}
            {isOverdue ? `Due ${dueDateDisplay} · Overdue` : `Due ${dueDateDisplay}`}
          </span>

          {assignedTo && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" aria-hidden="true" />
              {assignedTo}
            </span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      {isActionable && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Primary action: Close Gap — canonical label from actions.yaml */}
          {onCloseGap && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseGap}
              className="h-7 text-xs"
            >
              Close Gap
            </Button>
          )}

          {/* Secondary actions in dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              {onAssign && (
                <DropdownMenuItem onClick={onAssign}>
                  Assign
                </DropdownMenuItem>
              )}
              {onAddNote && (
                <DropdownMenuItem onClick={onAddNote}>
                  Add Note
                </DropdownMenuItem>
              )}
              {onExclude && (
                <DropdownMenuItem
                  onClick={onExclude}
                  className="text-muted-foreground"
                >
                  Exclude
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
