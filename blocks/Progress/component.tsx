import { cn } from "@/lib/utils"
import { Progress as ShadcnProgress } from "@/components/ui/progress"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Progress/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19
//
// INVARIANTS (meta.yaml):
//   Track: h-2 rounded-full bg-muted
//   Indicator: bg-primary rounded-full
//   Always includes aria-valuenow, aria-valuemin, aria-valuemax

interface ProgressBlockProps {
  /** Current progress value (0-100) */
  value: number
  /** Maximum value (default 100) */
  max?: number
  /** When true, shows a percentage label beside the bar */
  showLabel?: boolean
  /** Accessible label for screen readers */
  ariaLabel?: string
  className?: string
}

export function ProgressBlock({
  value,
  max = 100,
  showLabel = false,
  ariaLabel,
  className,
}: ProgressBlockProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ShadcnProgress
        value={percentage}
        className="h-2 rounded-full bg-muted flex-1"
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
      {showLabel && (
        <span className="text-sm font-semibold tabular-nums text-muted-foreground min-w-[3ch] text-right">
          {percentage}%
        </span>
      )}
    </div>
  )
}
