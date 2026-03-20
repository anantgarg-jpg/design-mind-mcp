import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, User, ChevronRight } from "lucide-react"

type TaskStatus = "open" | "in_progress" | "overdue" | "completed" | "cancelled"

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  open:        { label: "Open",        className: "border border-border text-muted-foreground bg-transparent" },
  in_progress: { label: "In Progress", className: "bg-accent text-accent-foreground border border-accent-foreground/20" },
  overdue:     { label: "Overdue",     className: "bg-[var(--warning-light)] text-warning border border-warning/30" },
  completed:   { label: "Completed",   className: "bg-success/10 text-success border border-success/30" },
  cancelled:   { label: "Cancelled",   className: "bg-muted text-muted-foreground border border-border" },
}

interface TaskRowProps {
  patientName: string           // Last, First
  title: string
  status: TaskStatus
  taskType?: string             // "Outreach", "Review", "Documentation"
  dueDisplay: string            // "Due Today", "Due 3 days ago · Overdue"
  isOverdue: boolean
  assignee?: string
  onComplete?: () => void
  onReassign?: () => void
  onExpand?: () => void
  className?: string
}

export function TaskRow({
  patientName, title, status, taskType, dueDisplay,
  isOverdue, assignee, onComplete, onReassign, onExpand, className,
}: TaskRowProps) {
  const s = STATUS_CONFIG[status]
  const isDone = status === "completed" || status === "cancelled"

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-2.5",
      "border-b border-border/40 last:border-0",
      "hover:bg-muted/40 transition-colors group",
      isOverdue && "border-l-2 border-warning",
      !isOverdue && "border-l-2 border-transparent",
      isDone && "opacity-50",
      className
    )}>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs text-muted-foreground leading-none mb-1">{patientName}</p>
        <p className={cn(
          "text-sm leading-snug",
          isDone ? "line-through text-muted-foreground" : "font-medium text-foreground"
        )}>
          {title}
        </p>

        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
          <span className={cn(
            "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
            s.className
          )}>
            {s.label}
          </span>

          {taskType && (
            <span className="text-xs text-muted-foreground">{taskType}</span>
          )}

          <span className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-warning font-medium" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" aria-hidden />
            {dueDisplay}
          </span>

          {assignee && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" aria-hidden />
              {assignee}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        {!isDone && onComplete && (
          <Button variant="outline" size="sm" onClick={onComplete} className="h-7 text-xs">
            Complete
          </Button>
        )}
        {!isDone && onReassign && (
          <Button variant="ghost" size="sm" onClick={onReassign} className="h-7 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Reassign
          </Button>
        )}
        {onExpand && (
          <Button variant="ghost" size="sm" onClick={onExpand} className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  )
}
