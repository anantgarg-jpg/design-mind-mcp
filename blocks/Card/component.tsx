import { cn } from "@/lib/utils"
import {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Card/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   rounded-lg border border-border/40 bg-card
//   shadow-sm when on muted/tinted background, no shadow on white background
//   p-4 content padding
//
// Elevation (styling-tokens.rule.md):
//   flat       — no shadow, border-driven (white-on-white)
//   shadow-sm  — card-raised, on muted/grey parent
//   shadow-md  — card-express, onboarding/expressive flows
//
// State feedback (styling-tokens.rule.md):
//   hover:    bg-foreground/[0.04]
//   active:   bg-foreground/[0.08]
//   focused:  ring-2 ring-ring ring-offset-1
//   selected: border-2 border-primary
//   disabled: opacity-50, pointer-events-none, no shadow, border border-border/40
//
// No nested cards permitted.

type CardElevation = "flat" | "sm" | "md"

interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Shadow elevation: "flat" (no shadow), "sm" (raised), "md" (expressive) */
  elevation?: CardElevation
  /** Makes the card interactive with hover/active/focus states */
  onClick?: () => void
  /** Renders the card in a selected state (2px primary border) */
  selected?: boolean
  /** Disables the card (50% opacity, no interaction) */
  disabled?: boolean
  className?: string
}

const elevationClass: Record<CardElevation, string> = {
  flat: "",
  sm: "shadow-sm",
  md: "shadow-md",
}

export function Card({
  title,
  description,
  children,
  footer,
  elevation = "flat",
  onClick,
  selected = false,
  disabled = false,
  className,
}: CardProps) {
  const isInteractive = !!onClick && !disabled

  return (
    <ShadcnCard
      role={onClick ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? (e) => e.key === "Enter" && onClick() : undefined}
      aria-disabled={disabled || undefined}
      aria-selected={selected || undefined}
      className={cn(
        "rounded-lg bg-card",
        disabled
          ? "border border-border/40 opacity-50 pointer-events-none"
          : elevation === "flat"
            ? "border border-border/40"
            : elevationClass[elevation],
        selected && !disabled && "border-2 border-primary",
        isInteractive && [
          "cursor-pointer transition-colors",
          "hover:bg-foreground/[0.04]",
          "active:bg-foreground/[0.08]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        ],
        className,
      )}
    >
      {(title || description) && (
        <CardHeader className="p-4 pb-0">
          {title && <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>}
          {description && <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-4">{children}</CardContent>
      {footer && <CardFooter className="p-4 pt-0">{footer}</CardFooter>}
    </ShadcnCard>
  )
}
