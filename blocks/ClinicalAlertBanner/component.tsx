import { AlertOctagon, AlertTriangle, AlertCircle, Info, X, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/ClinicalAlertBanner/meta.yaml
// Safety:   safety/severity-schema.yaml (single source of truth for severity tokens)
//           safety/hard-constraints.md rules 1, 5, 6
// Ontology: ontology/entities.yaml → Alert
//           ontology/states.yaml → AlertSeverity
//
// HARD CONSTRAINTS — never change without clinical leadership approval:
//   Rule 1: --severity-critical (--destructive) reserved exclusively for Critical.
//   Rule 5: Critical alerts cannot be dismissed. Only Acknowledge and Escalate.
//   Rule 6: High severity dismissal is use-case defined but must be intentional + reversible.
//
// SEVERITY TOKEN MAP (severity-schema.yaml):
//   critical → bg-destructive/10 + border-destructive    + text-destructive  | icon: alert-octagon
//   high     → bg-[var(--alert-light)] + border-alert/30 + text-alert        | icon: alert-triangle
//   medium   → bg-[var(--warning-light)] + border-warning/30 + text-warning  | icon: alert-circle
//   low      → bg-accent + border-accent-foreground/20   + text-accent-fg    | icon: info
//
// AUDIT: severity-schema marks critical/high/medium as audit_required: true.
// Pass onAuditEvent to capture Acknowledge and Dismiss events for your audit system.

type Severity = "critical" | "high" | "medium" | "low"

const SEVERITY_CONFIG = {
  critical: {
    // --destructive = Red = Critical severity
    containerClass: "bg-destructive/10 border-l-4 border-destructive",
    iconClass:      "text-destructive",
    titleClass:     "text-destructive",
    bodyClass:      "text-destructive/80",
    Icon:                   AlertOctagon,
    canDismiss:             false,   // hard-constraint rule 5
    requiresAcknowledge:    true,
    auditRequired:          true,    // severity-schema.yaml audit_required
  },
  high: {
    // --alert = Orange = High severity (≠ Alert entity)
    containerClass: "bg-[var(--alert-light)] border-l-4 border-alert",
    iconClass:      "text-alert",
    titleClass:     "text-alert",
    bodyClass:      "text-alert/80",
    Icon:                   AlertTriangle,
    canDismiss:             true,    // with reason per severity-schema permitted_actions
    requiresAcknowledge:    true,
    auditRequired:          true,
  },
  medium: {
    // --warning = Yellow = Medium severity
    containerClass: "bg-[var(--warning-light)] border-l-4 border-warning",
    iconClass:      "text-warning",
    titleClass:     "text-warning",
    bodyClass:      "text-warning/80",
    Icon:                   AlertCircle,
    canDismiss:             true,
    requiresAcknowledge:    false,
    auditRequired:          true,
  },
  low: {
    // --accent (blue tint) = Low severity / informational
    // border-accent-foreground/20 per severity-schema.yaml (not /30)
    containerClass: "bg-accent border-l-4 border-accent-foreground/20",
    iconClass:      "text-accent-foreground",
    titleClass:     "text-accent-foreground",
    bodyClass:      "text-accent-foreground/80",
    Icon:                   Info,
    canDismiss:             true,
    requiresAcknowledge:    false,
    auditRequired:          false,
  },
} as const

interface ClinicalAlertBannerProps {
  severity: Severity
  title: string
  body?: string
  // Patient name — use when alert is in a non-patient-scoped surface
  patientName?: string
  // triggeredAt: absolute timestamp required (hard-constraint rule 11)
  triggeredAt?: string
  // Required for critical + high (meta.yaml critical_rules)
  onAcknowledge?: () => void
  onEscalate?: () => void
  // Dismiss: forbidden on critical. For high: use-case defined with reason.
  onDismiss?: () => void
  // Audit hook — called with event type on acknowledge/dismiss for audit_required severities
  onAuditEvent?: (event: "acknowledged" | "dismissed" | "escalated", severity: Severity) => void
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
  onAuditEvent,
  className,
}: ClinicalAlertBannerProps) {
  const config = SEVERITY_CONFIG[severity]
  const { Icon } = config

  if (process.env.NODE_ENV === "development") {
    if (config.requiresAcknowledge && !onAcknowledge) {
      console.error(
        `ClinicalAlertBanner: severity="${severity}" requires onAcknowledge. ` +
        `See safety/hard-constraints.md rule 5 and safety/severity-schema.yaml.`
      )
    }
  }

  const handleAcknowledge = () => {
    onAuditEvent?.("acknowledged", severity)
    onAcknowledge?.()
  }

  const handleDismiss = () => {
    onAuditEvent?.("dismissed", severity)
    onDismiss?.()
  }

  const handleEscalate = () => {
    onAuditEvent?.("escalated", severity)
    onEscalate?.()
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
        className={cn("h-5 w-5 flex-shrink-0 mt-1", config.iconClass)}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Patient name in "Last, First" format — hard-constraint rule 7 */}
            {patientName && (
              <p className={cn("text-sm font-semibold mb-1", config.bodyClass)}>
                {patientName}
              </p>
            )}
            <p className={cn("text-base font-semibold", config.titleClass)}>
              {title}
            </p>
            {body && (
              <p className={cn("text-base mt-1", config.bodyClass)}>
                {body}
              </p>
            )}
            {/* Absolute timestamp required — hard-constraint rule 11 */}
            {triggeredAt && (
              <p className={cn("text-sm mt-1 opacity-70", config.bodyClass)}>
                {triggeredAt}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onEscalate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEscalate}
                className={cn("h-7 gap-1 text-sm", config.bodyClass)}
              >
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                Escalate
              </Button>
            )}

            {config.requiresAcknowledge && onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcknowledge}
                className="h-7 text-sm bg-card"
              >
                Acknowledge
              </Button>
            )}

            {/* Dismiss is forbidden on critical (hard-constraint rule 5) */}
            {config.canDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
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
