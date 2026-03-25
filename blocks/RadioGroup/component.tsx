import { cn } from "@/lib/utils"
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/RadioGroup/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 19, 20, 21
//
// INVARIANTS (meta.yaml):
//   Layout: flex flex-col gap-3
//   Each radio: h-4 w-4 rounded-full border border-subtle
//   Checked: border-primary fill-primary
//   44px min touch target on label+radio combined (rule 21)

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupBlockProps {
  options: RadioOption[]
  value?: string
  onValueChange?: (value: string) => void
  /** When true, applies error styling */
  error?: boolean
  /** Layout direction */
  orientation?: "vertical" | "horizontal"
  className?: string
}

export function RadioGroupBlock({
  options,
  value,
  onValueChange,
  error = false,
  orientation = "vertical",
  className,
}: RadioGroupBlockProps) {
  return (
    <ShadcnRadioGroup
      value={value}
      onValueChange={onValueChange}
      className={cn(
        orientation === "vertical" ? "flex flex-col gap-3" : "flex flex-row gap-4",
        className
      )}
      aria-invalid={error || undefined}
    >
      {options.map((option) => (
        <div
          key={option.value}
          className="flex items-start gap-2 min-h-[44px]"
        >
          <RadioGroupItem
            value={option.value}
            id={option.value}
            disabled={option.disabled}
            className={cn(
              "h-4 w-4 rounded-full border border-subtle mt-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              error && "border-destructive"
            )}
          />
          <Label
            htmlFor={option.value}
            className={cn(
              "text-base font-normal leading-tight cursor-pointer",
              option.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.label}
            {option.description && (
              <span className="block text-sm text-muted-foreground mt-0.5">
                {option.description}
              </span>
            )}
          </Label>
        </div>
      ))}
    </ShadcnRadioGroup>
  )
}
