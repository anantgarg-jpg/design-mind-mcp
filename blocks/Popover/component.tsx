import { cn } from "@/lib/utils"
import {
  Popover as ShadcnPopover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Popover/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20
//
// INVARIANTS (meta.yaml):
//   Container: rounded-md shadow-md z-20 bg-popover border border-border p-4
//   Positioned relative to trigger; ESC closes; focus trapped
//   Click outside closes

interface PopoverBlockProps {
  /** Element that opens the popover on click */
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function PopoverBlock({
  trigger,
  children,
  align = "center",
  side = "bottom",
  open,
  onOpenChange,
  className,
}: PopoverBlockProps) {
  return (
    <ShadcnPopover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>

      <PopoverContent
        align={align}
        side={side}
        className={cn(
          "rounded-md shadow-md bg-popover border border-border p-4",
          className
        )}
      >
        {children}
      </PopoverContent>
    </ShadcnPopover>
  )
}
