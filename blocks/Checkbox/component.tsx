import { cn } from "@/lib/utils"
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Checkbox/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20, 21
//
// INVARIANTS (meta.yaml):
//   h-4 w-4 rounded-sm border border-input
//   checked bg-primary
//   focus-visible:ring-2
//
// Rule 13: error state uses border-destructive, NOT --severity-critical.
// Rule 21: 44px touch target on label+checkbox combined.

interface CheckboxProps {
  id: string
  label: string
  checked?: boolean
  /** Indeterminate state for partial group selections */
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** Shows destructive border for validation errors (rule 13) */
  error?: boolean
  disabled?: boolean
  className?: string
}

export function Checkbox({
  id,
  label,
  checked,
  indeterminate,
  onCheckedChange,
  error = false,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <div className={cn("flex items-center gap-3 min-h-[44px]", className)}>
      <ShadcnCheckbox
        id={id}
        checked={indeterminate ? "indeterminate" : checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "h-4 w-4 rounded-sm border border-input",
          "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
        )}
      />
      <Label
        htmlFor={id}
        className={cn(
          "text-sm cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          error && "text-destructive",
        )}
      >
        {label}
      </Label>
    </div>
  )
}
