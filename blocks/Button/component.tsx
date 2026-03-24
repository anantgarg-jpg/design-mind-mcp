import { cn } from "@/lib/utils"
import { Button as ShadcnButton } from "@/components/ui/button"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Button/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 14, 18, 20, 21
//
// INVARIANTS (meta.yaml):
//   rounded-md border radius
//   min-h-[44px] touch target (rule 21)
//   whitespace-nowrap — label never wraps (rule 18)
//   focus-visible:ring-2 focus-visible:ring-ring (rule 20)
//
// Rule 14: only one primary (default variant) CTA visible per surface.

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Renders as a child element (e.g., anchor) instead of button */
  asChild?: boolean
  className?: string
}

export function Button({
  variant = "default",
  size = "default",
  asChild = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <ShadcnButton
      variant={variant}
      size={size}
      asChild={asChild}
      className={cn(
        "rounded-md whitespace-nowrap min-h-[44px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children}
    </ShadcnButton>
  )
}
