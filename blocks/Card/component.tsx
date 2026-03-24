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
//   rounded-lg border border-border/40 bg-card shadow-card
//   p-4 content padding
//
// No nested cards permitted.

interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Makes the card interactive with hover elevation */
  onClick?: () => void
  className?: string
}

export function Card({
  title,
  description,
  children,
  footer,
  onClick,
  className,
}: CardProps) {
  return (
    <ShadcnCard
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "rounded-lg border border-border/40 bg-card shadow-card",
        onClick && "cursor-pointer transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
