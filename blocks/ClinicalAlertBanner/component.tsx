import { AlertOctagon, AlertTriangle, AlertCircle, Info, X, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Severity colors use MDS tokens from theme.css — NOT Tailwind defaults
// Full severity spec in safety/severity-schema.yaml
// Token disambiguation in genome/rules/styling-tokens.rule.md

type Severity = "critical" | "high" | "medium" | "low"

const SEVERITY_CONFIG = {
  critical: {
    // --destructive = MDS Red = Critical severity
    containerClass: "bg-destructive/10 border-l-4 border-destructive",
    iconClass: "text-destructive",
    titleClass: "text-destructive",
    bodyClass: "text-destructive/80",
    Icon: AlertOctagon,
    canDismiss: false,
    requiresAcknowledge: true,
    requiresDismissReason: false,
  },
  high: {
    // --alert = MDS Orange = High severity (NOT the Alert entity)
    containerClass: "bg-[var(--alert-light)] border-l-4 border-alert",
    iconClass: "text-alert",
    titleClass: "text-alert",
    bodyClass: "text-alert/80",
    Icon: AlertTriangle,
    canDismiss: true,
    requiresAcknowledge: true,
    requiresDismissReason: true,
  },
  medium: {
    // --warning = MDS Yellow = Medium severity
    containerClass: "bg-[var(--warning-light)] border-l-4 border-warning",
    iconClass: "text-warning",
    titleClass: "text-warning",
    bodyClass: "text-warning/80",
    Icon: AlertCircle,
    canDismiss: true,
    requiresAcknowledge: false,
    requiresDismissReason: false,
  },
  low: {
    // --accent = blue tinted = Low severity / informational
    containerClass: "bg-accent border-l-4 border-accent-foreground/30",
    iconClass: "text-accent-foreground",
    titleClass: "text-accent-foreground",
    bodyClass: "text-accent-foreground/80",
    Icon: Info,
    canDismiss: true,
    requiresAcknowledge: false,
    requiresDismissReason: false,
  },
} as const

interface ClinicalAlertBannerProps {
  severity: Severity
  title: string
  body?: string
  patientName?: string
  triggeredAt?: string
  onAcknowledge?: () => void
  onEscalate?: () => void
  onDismiss?: (reason?: string) => void
  className?: string
}

export function ClinicalAlertBanner({
  severity,
  title,
  body,
  patientName,
  triggeredAt,
  onAcknowledge,
  onEscalate,
  onDismiss,
  className,
}: ClinicalAlertBannerProps) {
  const config = SEVERITY_CONFIG[severity]
  const { Icon } = config

  if (process.env.NODE_ENV === "development") {
    if (config.requiresAcknowledge && !onAcknowledge) {
      console.error(
        `ClinicalAlertBanner: severity="${severity}" requires onAcknowledge prop. ` +
        `See safety/hard-constraints.md rule 7.`
      )
    }
  }

  return (
    <div
      role="alert"
      aria-live={severity === "critical" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "flex gap-3 p-4 rounded-r-md",
        config.containerClass,
        className
      )}
    >
      <Icon
        className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconClass)}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            {patientName && (
              <p className={cn("text-xs font-medium mb-0.5", config.bodyClass)}>
                {patientName}
              </p>
            )}
            <p className={cn("text-sm font-semibold", config.titleClass)}>
              {title}
            </p>
            {body && (
              <p className={cn("text-sm mt-1", config.bodyClass)}>
                {body}
              </p>
            )}
            {triggeredAt && (
              <p className={cn("text-xs mt-1.5 opacity-70", config.bodyClass)}>
                {triggeredAt}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onEscalate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEscalate}
                className={cn("h-7 gap-1 text-xs", config.bodyClass)}
              >
                <ArrowUpRight className="h-3 w-3" />
                Escalate
              </Button>
            )}

            {config.requiresAcknowledge && onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAcknowledge}
                className="h-7 text-xs bg-card"
              >
                Acknowledge
              </Button>
            )}

            {config.canDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss()}
                className={cn("h-7 w-7 p-0", config.bodyClass)}
                aria-label="Dismiss alert"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
