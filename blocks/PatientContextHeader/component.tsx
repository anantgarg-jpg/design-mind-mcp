import { cn } from "@/lib/utils"
import { AlertOctagon } from "lucide-react"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/PatientContextHeader/meta.yaml
// Ontology: ontology/entities.yaml → Patient (identifier_label: "MRN")
// Safety:   safety/hard-constraints.md rules 7, 8, 10
//
// HARD CONSTRAINTS — never change without clinical leadership approval:
//   Rule 7:  Name always "Last, First" format. Never first name only.
//   Rule 8:  DOB always MM/DD/YYYY. Age may appear alongside but never replaces it.
//   Rule 10: Empty/null fields show "—". Blank space can be misread as cleared/zero.
//
// MRN label is hard-constrained as "MRN" — never "Patient ID", "Chart Number", etc.

interface PatientContextHeaderProps {
  // Required — hard-constraints.md rules 7, 8
  lastName: string
  firstName: string
  mrn: string
  // DOB must be passed as MM/DD/YYYY per hard-constraints.md rule 8
  // Age (copy-voice.md: MMM D, YYYY) applies to general dates but NOT DOB
  dateOfBirth: string

  // Optional context — rendered when present; absent fields produce no blank space
  age?: number
  primaryPayer?: string
  riskTier?: "high" | "medium" | "low" | "none"
  careTeamName?: string
  // Alert count badge: links to ClinicalAlertBanner stack below this header
  activeAlertCount?: number
  highestAlertSeverity?: "critical" | "high" | "medium" | "low"

  onAlertClick?: () => void
  className?: string
}

const RISK_CONFIG = {
  high:   { label: "High Risk",    classes: "bg-destructive/10 text-destructive border border-destructive/30" },
  medium: { label: "Medium Risk",  classes: "bg-[var(--alert-light)] text-alert border border-alert/30" },
  low:    { label: "Low Risk",     classes: "bg-success/10 text-success border border-success/30" },
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
  const hasAlerts = activeAlertCount != null && activeAlertCount > 0
  const alertIsCritical = highestAlertSeverity === "critical"

  // hard-constraint rule 10: required fields show "—" if empty
  const displayName   = `${lastName || "—"}, ${firstName || "—"}`
  const displayMrn    = mrn || "—"
  const displayDob    = dateOfBirth || "—"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4",
        "bg-card border-b border-border",
        className
      )}
      aria-label="Patient context"
    >
      {/* Patient identity — always visible, never truncated (meta.yaml invariant) */}
      <div className="flex items-center gap-6 min-w-0">
        <div>
          {/* Last, First format — hard-constraint rule 7 */}
          <p className="text-sm font-semibold text-foreground leading-tight">
            {displayName}
          </p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {/* "MRN" label is hard-constrained — ontology/entities.yaml identifier_label */}
            <span className="text-xs text-muted-foreground">
              MRN <span className="font-medium text-foreground">{displayMrn}</span>
            </span>
            {/* MM/DD/YYYY format — hard-constraint rule 8 */}
            <span className="text-xs text-muted-foreground">
              DOB <span className="font-medium text-foreground">{displayDob}</span>
              {age != null && (
                <span className="text-muted-foreground"> ({age}y)</span>
              )}
            </span>
            {primaryPayer && (
              <span className="text-xs text-muted-foreground">{primaryPayer}</span>
            )}
          </div>
        </div>
      </div>

      {/* Contextual signals — right-aligned, flex-shrink-0 so identity is never truncated */}
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

        {/* Alert indicator — links to ClinicalAlertBanner stack */}
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
            // canonical entity name "Alert" per ontology/entities.yaml
            aria-label={`${activeAlertCount} active Alert${activeAlertCount! > 1 ? "s" : ""}`}
          >
            <AlertOctagon className="h-3 w-3" aria-hidden="true" />
            {activeAlertCount} Alert{activeAlertCount! > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  )
}
