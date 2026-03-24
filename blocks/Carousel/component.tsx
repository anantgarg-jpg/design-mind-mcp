import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Carousel as CarouselRoot,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Carousel/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: overflow-hidden relative
//   Prev/Next buttons: outline iconOnly Button block, h-8 w-8 shadow-sm
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
      <CarouselNavButton direction="prev" orientation={orientation} />
      <CarouselNavButton direction="next" orientation={orientation} />
    </CarouselRoot>
  )
}

function CarouselNavButton({
  direction,
  orientation,
}: {
  direction: "prev" | "next"
  orientation: "horizontal" | "vertical"
}) {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()
  const isPrev = direction === "prev"

  return (
    <Button
      variant="outline"
      iconOnly
      onClick={isPrev ? scrollPrev : scrollNext}
      disabled={isPrev ? !canScrollPrev : !canScrollNext}
      aria-label={isPrev ? "Previous slide" : "Next slide"}
      className={cn(
        "absolute h-8 w-8 shadow-sm bg-background",
        "min-w-[44px] min-h-[44px]",
        orientation === "horizontal"
          ? isPrev
            ? "-left-12 top-1/2 -translate-y-1/2"
            : "-right-12 top-1/2 -translate-y-1/2"
          : isPrev
            ? "-top-12 left-1/2 -translate-x-1/2 rotate-90"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90"
      )}
    >
      {isPrev ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
    </Button>
  )
}

// Re-export primitives for custom composition
export { CarouselContent, CarouselItem }
