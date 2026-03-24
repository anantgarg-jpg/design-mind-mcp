import { cn } from "@/lib/utils"
import {
  HoverCard as ShadcnHoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/HoverCard/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19, 20
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg shadow-md z-20 bg-card border border-border p-4 max-w-[320px]
//   Open delay 200ms; close delay 100ms
//   Keyboard accessible via focus; never for critical info

interface HoverCardBlockProps {
  /** Element that triggers the hover card on hover/focus */
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "center" | "end"
  /** Open delay in ms (default 200) */
  openDelay?: number
  /** Close delay in ms (default 100) */
  closeDelay?: number
  className?: string
}

export function HoverCardBlock({
  trigger,
  children,
  align = "center",
  openDelay = 200,
  closeDelay = 100,
  className,
}: HoverCardBlockProps) {
  return (
    <ShadcnHoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>

      <HoverCardContent
        align={align}
        className={cn(
          "rounded-lg shadow-md bg-card border border-border p-4 max-w-[320px]",
          className
        )}
      >
        {children}
      </HoverCardContent>
    </ShadcnHoverCard>
  )
}
