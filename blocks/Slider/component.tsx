import { cn } from "@/lib/utils"
import { Slider as ShadcnSlider } from "@/components/ui/slider"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Slider/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Track: h-1.5 rounded-full bg-muted
//   Thumb: h-4 w-4 rounded-full bg-primary border-2 border-primary-foreground shadow-sm

interface SliderProps {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** Accessible label for the current value, e.g. "50 percent" */
  ariaValueText?: string
  className?: string
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  ariaValueText,
  className,
}: SliderProps) {
  return (
    <ShadcnSlider
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-valuetext={ariaValueText}
      className={cn(
        // 44px touch target via vertical padding on the root
        "py-3",
        "focus-visible:outline-none",
        className,
      )}
    />
  )
}
