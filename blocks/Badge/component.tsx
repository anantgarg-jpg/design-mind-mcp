import { cn } from "@/lib/utils"
import { Badge as ShadcnBadge } from "@/components/ui/badge"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Badge/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 19
//
// INVARIANTS (meta.yaml):
//   rounded-full pill shape
//   text-sm font-semibold
//   px-2.5 py-0.5 compact padding
//   inline-flex items-center
//
// Rule 19: color never sole differentiator — text label always present.

type BadgeColor = "blue" | "red" | "yellow" | "orange" | "green" | "grey"

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  /** When true, renders a small dot before the label */
  dot?: boolean
  className?: string
}

const dotColorMap: Record<BadgeColor, string> = {
  blue:   "bg-primary",
  red:    "bg-destructive",
  yellow: "bg-warning-text",
  orange: "bg-alert-text",
  green:  "bg-success-text",
  grey:   "bg-muted-foreground",
}

export function Badge({
  children,
  color = "blue",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <ShadcnBadge
      badgeColor={color}
      badgeStyle="subtle"
      className={cn(
        "rounded-full text-sm font-semibold px-2.5 py-0.5 inline-flex items-center gap-1.5",
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "shrink-0 size-1.5 rounded-full",
            dotColorMap[color],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </ShadcnBadge>
  )
}
