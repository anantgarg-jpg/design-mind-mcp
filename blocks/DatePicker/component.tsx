import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/DatePicker/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Trigger: h-9 rounded-md border border-input px-3
//   Calendar popover: rounded-md shadow-md
//   Calendar icon: left-aligned inside trigger

interface DatePickerProps {
  value?: Date
  onValueChange: (date: Date | undefined) => void
  placeholder?: string
  /** Date display format string (date-fns) */
  displayFormat?: string
  /** When true, applies border-destructive to the trigger */
  hasError?: boolean
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a date",
  displayFormat = "PPP",
  hasError = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-start rounded-md border border-input px-3 text-sm font-normal",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            !value && "text-muted-foreground",
            hasError && "border-destructive",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          {value ? (
            <span className="font-mono">{format(value, displayFormat)}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-md shadow-md"
        align="start"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onValueChange(date)
            setOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
