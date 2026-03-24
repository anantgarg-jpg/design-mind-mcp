import { cn } from "@/lib/utils"
import { Input as ShadcnInput } from "@/components/ui/input"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Input/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20
//
// INVARIANTS (meta.yaml):
//   h-9 rounded-md border border-input bg-background px-3 text-base
//   Focus: focus-visible:ring-2 ring-ring (never suppressed)
//   Error state: border-destructive (rule 13, NOT severity-critical)

interface InputBlockProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** When true, applies error styling (border-destructive) */
  error?: boolean
  className?: string
}

export function InputBlock({
  error = false,
  className,
  ...props
}: InputBlockProps) {
  return (
    <ShadcnInput
      className={cn(
        "h-9 rounded-md border border-input bg-background px-3 text-base",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        error && "border-destructive focus-visible:ring-destructive",
        className
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  )
}
