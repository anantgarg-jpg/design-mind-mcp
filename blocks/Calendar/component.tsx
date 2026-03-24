import { cn } from "@/lib/utils"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import type { DayPickerSingleProps } from "react-day-picker"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Calendar/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   rounded-md container
//   p-3 internal padding
//   text-sm date labels
//   today ring-accent indicator
//   selected bg-primary text-primary-foreground
//
// tabular-nums on day cells for alignment.

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  /** Dates that should be disabled / non-selectable */
  disabled?: DayPickerSingleProps["disabled"]
  className?: string
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) {
  return (
    <ShadcnCalendar
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      className={cn("rounded-md p-3", className)}
      classNames={{
        day: "tabular-nums text-sm",
        day_today: "ring-1 ring-accent",
        day_selected: "bg-primary text-primary-foreground",
        day_outside: "text-muted-foreground opacity-50",
      }}
    />
  )
}
