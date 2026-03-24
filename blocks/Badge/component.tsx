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

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline"
  /** Optional icon rendered before the label — does not replace the text */
  icon?: React.ReactNode
  className?: string
}

export function Badge({
  children,
  variant = "default",
  icon,
  className,
}: BadgeProps) {
  return (
    <ShadcnBadge
      variant={variant}
      className={cn(
        "rounded-full text-sm font-semibold px-2.5 py-0.5 inline-flex items-center gap-1",
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </ShadcnBadge>
  )
}
