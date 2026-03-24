import { cn } from "@/lib/utils"
import {
  Alert as ShadcnAlert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Alert/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 19
//
// INVARIANTS (meta.yaml):
//   rounded-lg border
//   p-4 internal padding
//   gap-3 icon-to-text spacing

interface AlertProps {
  title?: string
  children: React.ReactNode
  /** Icon rendered to the left of the text content */
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  className?: string
}

export function Alert({
  title,
  children,
  icon,
  variant = "default",
  className,
}: AlertProps) {
  return (
    <ShadcnAlert
      variant={variant}
      className={cn(
        "rounded-lg border p-4",
        variant === "default" && "border-border",
        variant === "destructive" && "border-destructive text-destructive",
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="flex flex-col gap-1">
        {title && <AlertTitle className="font-semibold text-base">{title}</AlertTitle>}
        <AlertDescription className="text-sm text-muted-foreground">
          {children}
        </AlertDescription>
      </div>
    </ShadcnAlert>
  )
}
