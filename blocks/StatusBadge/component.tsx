import { cn } from "@/lib/utils"

// Status values from ontology/states.yaml
// Color tokens from genome/rules/styling-tokens.rule.md (MDS tokens)
// NEVER use hardcoded Tailwind color classes — always use MDS semantic tokens

const STATUS_CONFIG = {
  // Task states
  open:        { label: "Open",        classes: "border border-border text-muted-foreground bg-transparent" },
  in_progress: { label: "In Progress", classes: "bg-accent text-accent-foreground border border-accent-foreground/20" },
  completed:   { label: "Completed",   classes: "bg-success/10 text-success border border-success/30" },
  overdue:     { label: "Overdue",     classes: "bg-[var(--warning-light)] text-warning border border-warning/30" },
  cancelled:   { label: "Cancelled",   classes: "bg-muted text-muted-foreground border border-border" },

  // Care gap states
  in_outreach: { label: "In Outreach", classes: "bg-accent text-accent-foreground border border-accent-foreground/20" },
  closed:      { label: "Closed",      classes: "bg-success/10 text-success border border-success/30" },
  excluded:    { label: "Excluded",    classes: "border border-border text-muted-foreground bg-transparent" },

  // Alert severity — sourced from safety/severity-schema.yaml
  // --destructive = Critical, --alert = High, --warning = Medium, --accent = Low
  critical:    { label: "Critical",    classes: "bg-destructive/10 text-destructive border border-destructive/30" },
  high:        { label: "High",        classes: "bg-[var(--alert-light)] text-alert border border-alert/30" },
  medium:      { label: "Medium",      classes: "bg-[var(--warning-light)] text-warning border border-warning/30" },
  low:         { label: "Low",         classes: "bg-accent text-accent-foreground border border-accent-foreground/20" },

  // Protocol / program-level statuses
  active:      { label: "Active",      classes: "bg-success/10 text-success border border-success/30" },
  draft:       { label: "Draft",       classes: "bg-accent text-accent-foreground border border-accent-foreground/20" },
  inactive:    { label: "Inactive",    classes: "bg-muted text-muted-foreground border border-border" },
  archived:    { label: "Archived",    classes: "bg-muted text-muted-foreground border border-border" },
  coming_soon: { label: "Coming soon", classes: "bg-muted text-muted-foreground border border-border" },
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
      console.warn(`StatusBadge: unknown status "${status}". Add to ontology/states.yaml.`)
    }
    return null
  }

  return (
    <span
      role="status"
      aria-label={config.label}
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  )
}
