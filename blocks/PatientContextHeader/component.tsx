import { cn } from "@/lib/utils"
import { AlertOctagon } from "lucide-react"

// Field labels and formats sourced from:
// - ontology/entities.yaml (Patient canonical fields)
// - safety/hard-constraints.md (rules 8, 9, 10)
// DO NOT change "MRN" label or date format without SME approval

interface PatientContextHeaderProps {
  // Required — hard-constraints.md rules 8, 9, 10
  lastName: string
  firstName: string
  mrn: string
  dateOfBirth: string   // Display string: "Jan 5, 1968"

  // Optional context
  age?: number
  primaryPayer?: string
  riskTier?: "high" | "medium" | "low" | "none"
  careTeamName?: string
  activeAlertCount?: number
  highestAlertSeverity?: "critical" | "high" | "medium" | "low"

  onAlertClick?: () => void
  className?: string
}

const RISK_CONFIG = {
  high:   { label: "High Risk",   classes: "bg-destructive/10 text-destructive border border-destructive/30" },
  medium: { label: "Medium Risk", classes: "bg-[var(--alert-light)] text-alert border border-alert/30" },
  low:    { label: "Low Risk",    classes: "bg-success/10 text-success border border-success/30" },
  none:   { label: "No Risk Score", classes: "bg-muted text-muted-foreground border border-border" },
}

export function PatientContextHeader({
  lastName,
  firstName,
  mrn,
  dateOfBirth,
  age,
  primaryPayer,
  riskTier,
  careTeamName,
  activeAlertCount,
  highestAlertSeverity,
  onAlertClick,
  className,
}: PatientContextHeaderProps) {
  const riskConfig = riskTier ? RISK_CONFIG[riskTier] : null
  const hasAlerts = activeAlertCount && activeAlertCount > 0
  const alertIsCritical = highestAlertSeverity === "critical"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4",
        "bg-card border-b border-border",
        className
      )}
      aria-label="Patient context"
    >
      {/* Patient identity — always visible, never truncated */}
      <div className="flex items-center gap-6 min-w-0">
        <div>
          {/* Last, First format per ontology/entities.yaml */}
          <p className="text-sm font-semibold text-foreground leading-tight">
            {lastName}, {firstName}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            {/* MRN label is hard-constrained — rule 9 */}
            <span className="text-xs text-muted-foreground">
              MRN <span className="font-medium text-foreground">{mrn}</span>
            </span>
            {/* Full DOB always shown — rule 10 */}
            <span className="text-xs text-muted-foreground">
              DOB <span className="font-medium text-foreground">{dateOfBirth}</span>
              {age !== undefined && (
                <span className="text-muted-foreground"> ({age}y)</span>
              )}
            </span>
            {primaryPayer && (
              <span className="text-xs text-muted-foreground">{primaryPayer}</span>
            )}
          </div>
        </div>
      </div>

      {/* Contextual signals */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {careTeamName && (
          <span className="text-xs text-muted-foreground hidden md:block">
            {careTeamName}
          </span>
        )}

        {riskConfig && (
          <span className={cn(
            "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
            riskConfig.classes
          )}>
            {riskConfig.label}
          </span>
        )}

        {/* Alert indicator — links to alert stack */}
        {hasAlerts && (
          <button
            onClick={onAlertClick}
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              "px-2 py-0.5 rounded-full border transition-colors",
              alertIsCritical
                ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                : "bg-[var(--alert-light)] text-alert border-alert/30 hover:bg-[var(--alert-light)]"
            )}
            aria-label={`${activeAlertCount} active alert${activeAlertCount > 1 ? "s" : ""}`}
          >
            <AlertOctagon className="h-3 w-3" aria-hidden="true" />
            {activeAlertCount} alert{activeAlertCount > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  )
}
