import { cn } from "@/lib/utils"

type StatVariant = "default" | "urgent" | "warning" | "success"

const VARIANT_CONFIG: Record<StatVariant, { valueClass: string; subtitleClass: string }> = {
  default: { valueClass: "text-foreground",   subtitleClass: "text-muted-foreground" },
  urgent:  { valueClass: "text-destructive",  subtitleClass: "text-destructive/70" },
  warning: { valueClass: "text-warning",      subtitleClass: "text-warning/70" },
  success: { valueClass: "text-success",      subtitleClass: "text-success/70" },
}

interface StatCardProps {
  label: string
  value: number | string
  subtitle?: string
  variant?: StatVariant
  onClick?: () => void
  className?: string
}

export function StatCard({
  label, value, subtitle, variant = "default", onClick, className,
}: StatCardProps) {
  const v = VARIANT_CONFIG[variant]

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 p-4 bg-card rounded-lg border border-border/40 shadow-card",
        "transition-shadow",
        onClick && "cursor-pointer hover:shadow-card-hover",
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={cn("text-2xl font-semibold tabular-nums leading-none", v.valueClass)}>
        {value}
      </p>
      {subtitle && (
        <p className={cn("text-xs leading-tight", v.subtitleClass)}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
