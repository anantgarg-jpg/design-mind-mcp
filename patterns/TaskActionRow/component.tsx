import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge, type StatusKey } from "@/components/StatusBadge"
import { Calendar, User, ChevronRight } from "lucide-react"

// Action labels from ontology/actions.yaml
// Status values from ontology/states.yaml TaskStatus
// Date formatting from ontology/copy-voice.md

interface TaskActionRowProps {
  taskTitle: string
  status: "open" | "in_progress" | "completed" | "overdue" | "cancelled"
  dueDate: string           // ISO date string
  dueDateDisplay: string    // "Jan 5, 2025" or "2 days ago"
  isOverdue: boolean
  assignedTo?: string
  patientName?: string      // shown when used outside patient context
  taskType?: string         // e.g. "Outreach", "Review", "Documentation"
  onComplete?: () => void
  onReassign?: () => void
  onExpand?: () => void
  className?: string
}

export function TaskActionRow({
  taskTitle,
  status,
  dueDate,
  dueDateDisplay,
  isOverdue,
  assignedTo,
  patientName,
  taskType,
  onComplete,
  onReassign,
  onExpand,
  className,
}: TaskActionRowProps) {
  const isActionable = status === "open" || status === "in_progress" || status === "overdue"
  const isDone = status === "completed" || status === "cancelled"

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3.5",
        "border-b border-border/40 last:border-0",
        "bg-card hover:bg-muted/60 transition-colors",
        // Overdue gets left accent per component behavior rules
        isOverdue && "border-l-2 border-l-warning",
        !isOverdue && "border-l-2 border-l-transparent",
        isDone && "opacity-50",
        className
      )}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {patientName && (
          <p className="text-xs text-muted-foreground mb-0.5">{patientName}</p>
        )}

        <div className="flex items-start gap-2">
          <p className={cn(
            "text-sm leading-snug flex-1 min-w-0",
            isDone ? "line-through text-muted-foreground" : "text-foreground font-medium"
          )}>
            {taskTitle}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <StatusBadge status={status as StatusKey} size="sm" />

          {taskType && (
            <span className="text-xs text-muted-foreground">{taskType}</span>
          )}

          {/* Due date — format from copy-voice.md */}
          <span className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-warning font-medium" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" aria-hidden="true" />
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

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        {isActionable && onComplete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onComplete}
            className="h-7 text-xs"
          >
            Complete
          </Button>
        )}

        {isActionable && onReassign && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReassign}
            className="h-7 text-xs text-muted-foreground"
          >
            Reassign
          </Button>
        )}

        {onExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="h-7 w-7 p-0 text-muted-foreground"
            aria-label="View task details"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
