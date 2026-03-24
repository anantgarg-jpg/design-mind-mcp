import { cn } from "@/lib/utils"
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Select/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20, 21
//
// INVARIANTS (meta.yaml):
//   Trigger: h-9 rounded-md border border-input px-3 bg-background
//   Content: rounded-md shadow-md z-20 bg-card border
//   Item: py-1.5 px-2 cursor-pointer hover:bg-muted/50

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  /** Displays border-destructive when true (rule 13) */
  error?: boolean
  disabled?: boolean
  className?: string
}

export function Select({
  options,
  placeholder = "Select...",
  value,
  onValueChange,
  error = false,
  disabled = false,
  className,
}: SelectProps) {
  return (
    <ShadcnSelect value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-11 min-h-[44px] rounded-md border border-input bg-background px-3 text-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-md shadow-md z-20 bg-card border">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className="py-1.5 px-2 cursor-pointer hover:bg-muted/50"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  )
}
