import { cn } from "@/lib/utils"
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Tooltip/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 20
//
// INVARIANTS (meta.yaml):
//   Content: rounded-md shadow-sm z-60
//   Style: bg-foreground text-background text-sm px-3 py-1.5
//   Width: max-w-[220px]

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  /** Open delay in ms (default 400ms to prevent accidental triggers) */
  delayDuration?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  side = "top",
  delayDuration = 400,
  className,
}: TooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration} skipDelayDuration={100}>
      <ShadcnTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            "rounded-md shadow-sm z-60",
            "bg-foreground text-background text-sm px-3 py-1.5",
            "max-w-[220px]",
            className,
          )}
        >
          {content}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  )
}
