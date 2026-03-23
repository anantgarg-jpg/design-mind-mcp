import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  count?: number
  countVariant?: "default" | "urgent" | "warning"
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({
  title, count, countVariant = "default", action, className,
}: SectionHeaderProps) {
  const countClass = {
    default: "text-muted-foreground",
    urgent:  "text-destructive font-semibold",
    warning: "text-warning font-semibold",
  }[countVariant]

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2",
      className
    )}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {count !== undefined && (
          <span className={cn("text-xs tabular-nums", countClass)}>
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
