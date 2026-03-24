import { cn } from "@/lib/utils"
import {
  ToggleGroup as ShadcnToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/ToggleGroup/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 20
//
// INVARIANTS (meta.yaml):
//   Container: flex gap-1
//   Items: rounded-md
//   Active: bg-muted font-semibold

interface ToggleGroupOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

interface ToggleGroupSingleProps {
  type: "single"
  value?: string
  onValueChange?: (value: string) => void
  options: ToggleGroupOption[]
  className?: string
}

interface ToggleGroupMultipleProps {
  type: "multiple"
  value?: string[]
  onValueChange?: (value: string[]) => void
  options: ToggleGroupOption[]
  className?: string
}

type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps

export function ToggleGroup(props: ToggleGroupProps) {
  const { type, options, className } = props

  return (
    <ShadcnToggleGroup
      type={type}
      value={props.value as any}
      onValueChange={props.onValueChange as any}
      className={cn("flex gap-1", className)}
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
          className={cn(
            "rounded-md px-3 min-h-[44px] min-w-[44px]",
            "data-[state=on]:bg-muted data-[state=on]:font-semibold",
            "hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            opt.disabled && "opacity-50",
          )}
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ShadcnToggleGroup>
  )
}
