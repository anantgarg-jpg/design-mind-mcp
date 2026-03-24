import { cn } from "@/lib/utils"
import { AlertOctagon } from "lucide-react"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/EntityContextHeader/meta.yaml
// Safety:   safety/hard-constraints.md rule 10
//
// STRUCTURAL CONSTRAINTS:
//   Rule 10: Empty/null fields show "—". Blank space can be misread as cleared/zero.
//
// Identifier labels and name format are configurable — consuming surfaces
// pass domain-specific labels (e.g. "MRN", "DOB") via props.

interface EntityContextHeaderProps {
  // Pre-formatted entity name (format enforced by consuming surface)
  name: string
  // Primary identifier value (e.g. MRN, order number, case ID)
  primaryId: string
  // Label for primary identifier (default: "ID")
  primaryIdLabel?: string
  // Secondary identifier value (e.g. DOB, created date)
  secondaryId: string
  // Label for secondary identifier (default: "")
  secondaryIdLabel?: string

  // Optional context — rendered when present; absent fields produce no blank space
  tertiaryLabel?: string
  tier?: "high" | "medium" | "low" | "none"
  teamName?: string
  // Alert count badge: links to AlertBanner stack below this header
  alertCount?: number
  alertSeverity?: "critical" | "high" | "medium" | "low"

  onAlertClick?: () => void
  className?: string
}

const TIER_CONFIG = {
  high:   { label: "High",    classes: "bg-destructive/10 text-destructive border border-destructive/30" },
  medium: { label: "Medium",  classes: "bg-[var(--alert-light)] text-alert border border-alert/30" },
  low:    { label: "Low",     classes: "bg-success/10 text-success border border-success/30" },
  none:   { label: "None",    classes: "bg-muted text-muted-foreground border border-border" },
}

export function EntityContextHeader({
  name,
  primaryId,
  primaryIdLabel = "ID",
  secondaryId,
  secondaryIdLabel = "",
  tertiaryLabel,
  tier,
  teamName,
  alertCount,
  alertSeverity,
  onAlertClick,
  className,
}: EntityContextHeaderProps) {
  const tierConfig = tier ? TIER_CONFIG[tier] : null
  const hasAlerts = alertCount != null && alertCount > 0
  const alertIsCritical = alertSeverity === "critical"

  // Empty fields show "—" not blank
  const displayName       = name || "—"
  const displayPrimaryId  = primaryId || "—"
  const displaySecondaryId = secondaryId || "—"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4",
        "bg-card border-b border-border",
        className
      )}
      aria-label="Entity context"
    >
      {/* Entity identity — always visible, never truncated (meta.yaml invariant) */}
      <div className="flex items-center gap-6 min-w-0">
        <div>
          <p className="text-base font-semibold text-foreground leading-tight">
            {displayName}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {primaryIdLabel} <span className="font-semibold text-foreground">{displayPrimaryId}</span>
            </span>
            {secondaryIdLabel ? (
              <span className="text-sm text-muted-foreground">
                {secondaryIdLabel} <span className="font-semibold text-foreground">{displaySecondaryId}</span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {displaySecondaryId}
              </span>
            )}
            {tertiaryLabel && (
              <span className="text-sm text-muted-foreground">{tertiaryLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Contextual signals — right-aligned, flex-shrink-0 so identity is never truncated */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {teamName && (
          <span className="text-sm text-muted-foreground hidden md:block">
            {teamName}
          </span>
        )}

        {tierConfig && (
          <span className={cn(
            "inline-flex items-center text-sm font-semibold px-2 py-0.5 rounded-full",
            tierConfig.classes
          )}>
            {tierConfig.label}
          </span>
        )}

        {/* Alert indicator — links to AlertBanner stack */}
        {hasAlerts && (
          <Button
            variant="transparent"
            size="sm"
            leftIcon={<AlertOctagon className="h-3 w-3" aria-hidden="true" />}
            onClick={onAlertClick}
            className={cn(
              "inline-flex items-center gap-1 text-sm font-semibold",
              "px-2 py-0.5 rounded-full border transition-colors",
              alertIsCritical
                ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                : "bg-[var(--alert-light)] text-alert border-alert/30 hover:bg-[var(--alert-light)]"
            )}
            aria-label={`${alertCount} active alert${alertCount! > 1 ? "s" : ""}`}
          >
            {alertCount} Alert{alertCount! > 1 ? "s" : ""}
          </Button>
        )}
      </div>
    </div>
  )
}
