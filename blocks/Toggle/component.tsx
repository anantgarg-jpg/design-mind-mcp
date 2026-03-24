import { cn } from "@/lib/utils"
import { Toggle as ShadcnToggle } from "@/components/ui/toggle"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Toggle/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Root: rounded-md h-9 px-3
//   Pressed: bg-muted
//   Hover: hover:bg-muted/50
//   Focus: focus-visible:ring-2

interface ToggleProps {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  variant?: "default" | "outline"
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export function Toggle({
  pressed,
  onPressedChange,
  variant = "default",
  disabled = false,
  children,
  className,
}: ToggleProps) {
  return (
    <ShadcnToggle
      pressed={pressed}
      onPressedChange={onPressedChange}
      variant={variant}
      disabled={disabled}
      className={cn(
        "rounded-md h-9 min-w-[44px] min-h-[44px] px-3",
        "hover:bg-muted/50 data-[state=on]:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </ShadcnToggle>
  )
}
