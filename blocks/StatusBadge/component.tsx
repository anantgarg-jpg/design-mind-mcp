import { cn } from "@/lib/utils"

// ── Genome sources ────────────────────────────────────────────────────────────
// Status values:   ontology/states.yaml
// Color tokens:    genome/rules/styling-tokens.rule.md (design tokens)
// Safety:          safety/severity-schema.yaml (AlertSeverity rendering)
//
// NEVER use hardcoded Tailwind color classes — all color decisions use design tokens.
//
// NOTE ON ENTITY-SCOPED STATUS:
// CareGapStatus.open maps to --status-warning (amber) per ontology/states.yaml.
// TaskStatus.open maps to --status-neutral (outline/muted).
// Both have canonical_name "Open" but different visual treatment.
// Use `care_gap_open` for CareGap open state, `open` for Task open state.

const STATUS_CONFIG = {
  // ── Task states (ontology/states.yaml → TaskStatus) ──────────────────────
  open: {
    label: "Open",
    classes: "border border-border text-muted-foreground bg-transparent",
  },
  in_progress: {
    label: "In Progress",
    // --status-info → accent (blue tint)
    classes: "bg-accent text-accent-foreground border border-accent-foreground/20",
  },
  completed: {
    label: "Completed",
    classes: "bg-success/10 text-success border border-success/30",
  },
  overdue: {
    label: "Overdue",
    classes: "bg-[var(--warning-light)] text-warning border border-warning/30",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-muted text-muted-foreground border border-border",
  },

  // ── Care gap states (ontology/states.yaml → CareGapStatus) ───────────────
  // open care gaps use amber/warning — distinct from task open (neutral)
  care_gap_open: {
    label: "Open",
    classes: "bg-[var(--warning-light)] text-warning border border-warning/30",
  },
  in_outreach: {
    label: "In Outreach",
    classes: "bg-accent text-accent-foreground border border-accent-foreground/20",
  },
  closed: {
    label: "Closed",
    classes: "bg-success/10 text-success border border-success/30",
  },
  excluded: {
    label: "Excluded",
    classes: "bg-muted text-muted-foreground border border-border",
  },

  // ── Alert severity (safety/severity-schema.yaml → AlertSeverity) ─────────
  // --destructive = Red = Critical severity (NOT the Alert entity)
  // --alert       = Orange = High severity
  // --warning     = Yellow = Medium severity
  // --accent      = Blue tint = Low severity
  critical: {
    label: "Critical",
    classes: "bg-destructive/10 text-destructive border border-destructive/30",
  },
  high: {
    label: "High",
    classes: "bg-[var(--alert-light)] text-alert border border-alert/30",
  },
  medium: {
    label: "Medium",
    classes: "bg-[var(--warning-light)] text-warning border border-warning/30",
  },
  low: {
    label: "Low",
    // border-accent-foreground/20 per severity-schema.yaml
    classes: "bg-accent text-accent-foreground border border-accent-foreground/20",
  },

  // ── Protocol / program states ─────────────────────────────────────────────
  active: {
    label: "Active",
    classes: "bg-success/10 text-success border border-success/30",
  },
  draft: {
    label: "Draft",
    classes: "bg-accent text-accent-foreground border border-accent-foreground/20",
  },
  inactive: {
    label: "Inactive",
    classes: "bg-muted text-muted-foreground border border-border",
  },
  archived: {
    label: "Archived",
    classes: "bg-muted text-muted-foreground border border-border",
  },
  coming_soon: {
    label: "Coming Soon",
    classes: "bg-muted text-muted-foreground border border-border",
  },
} as const

export type StatusKey = keyof typeof STATUS_CONFIG

interface StatusBadgeProps {
  status: StatusKey
  size?: "sm" | "md"
  className?: string
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `StatusBadge: unknown status "${status}". ` +
        `Verify against ontology/states.yaml. ` +
        `For CareGap open state use "care_gap_open", not "open".`
      )
    }
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <span
      role="status"
      aria-label={config.label}
      className={cn(
        "inline-flex items-center rounded-full",
        // Spacing: py-0.5 (2px) vertical, px-2 (8px) horizontal for both sizes
        "px-2 py-0.5",
        // Typography: md = body-default (text-base/14px), sm = body-small (text-sm/12px)
        size === "sm" ? "text-sm font-semibold" : "text-base font-semibold",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  )
}
