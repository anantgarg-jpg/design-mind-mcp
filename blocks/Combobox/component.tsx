import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Combobox/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20, 21
//
// INVARIANTS (meta.yaml):
//   Trigger: h-9 rounded-md border border-input px-3
//   Popover: rounded-md shadow-md z-20
//   Items: py-1.5 px-2 rounded-sm

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  /** Search input placeholder inside the popover */
  searchPlaceholder?: string
  /** When true, applies border-destructive to the trigger (rule 13) */
  hasError?: boolean
  disabled?: boolean
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  hasError = false,
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between rounded-md border border-input px-3 text-sm font-normal",
            "min-h-[44px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !value && "text-muted-foreground",
            hasError && "border-destructive",
            className
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                className="rounded-sm p-0.5 hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  onValueChange("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation()
                    onValueChange("")
                  }
                }}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md shadow-md z-20"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9 text-sm" />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className="py-1.5 px-2 rounded-sm min-h-[44px] flex items-center gap-2 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
