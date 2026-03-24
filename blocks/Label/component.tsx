import { cn } from "@/lib/utils"
import { Label as ShadcnLabel } from "@/components/ui/label"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Label/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 19
//
// INVARIANTS (meta.yaml):
//   Typography: text-base font-semibold leading-none
//   Disabled peer: peer-disabled:opacity-50
//   Error state: text-destructive (rule 13)

interface LabelBlockProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** When true, appends a required indicator */
  required?: boolean
  /** When true, applies error styling (text-destructive) */
  error?: boolean
  children: React.ReactNode
  className?: string
}

export function LabelBlock({
  required = false,
  error = false,
  children,
  className,
  ...props
}: LabelBlockProps) {
  return (
    <ShadcnLabel
      className={cn(
        "text-base font-semibold leading-none",
        "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
        error && "text-destructive",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </ShadcnLabel>
  )
}
