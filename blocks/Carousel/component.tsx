import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Carousel as CarouselRoot,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Carousel/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: overflow-hidden relative
//   Prev/Next buttons: rounded-full h-8 w-8 border shadow-sm
//   Items: gap-4 between slides

interface CarouselFrameProps {
  /** Array of content nodes, each rendered as a slide */
  items: React.ReactNode[]
  /** Basis class for each item (e.g., "basis-1/3" for 3-up) */
  itemBasis?: string
  /** Enable or disable drag interaction */
  draggable?: boolean
  /** Carousel orientation */
  orientation?: "horizontal" | "vertical"
  className?: string
}

export function CarouselFrame({
  items,
  itemBasis = "basis-full",
  draggable = true,
  orientation = "horizontal",
  className,
}: CarouselFrameProps) {
  return (
    <CarouselRoot
      opts={{
        align: "start",
        dragFree: draggable,
      }}
      orientation={orientation}
      className={cn("w-full", className)}
    >
      <CarouselContent className="-ml-4">
        {items.map((item, index) => (
          <CarouselItem key={index} className={cn("pl-4", itemBasis)}>
            {item}
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Navigation buttons — 44px touch targets (rule 21) */}
      <CarouselPrevious
        className={cn(
          "rounded-full h-8 w-8 border shadow-sm bg-background",
          "min-w-[44px] min-h-[44px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      />
      <CarouselNext
        className={cn(
          "rounded-full h-8 w-8 border shadow-sm bg-background",
          "min-w-[44px] min-h-[44px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      />
    </CarouselRoot>
  )
}

// Re-export primitives for custom composition
export { CarouselContent, CarouselItem }
