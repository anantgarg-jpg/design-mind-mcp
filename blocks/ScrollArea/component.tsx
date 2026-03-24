import { cn } from "@/lib/utils"
import { ScrollArea as ShadcnScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/ScrollArea/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20
//
// INVARIANTS (meta.yaml):
//   Container: overflow-hidden
//   Scrollbar: w-2.5 rounded-full bg-border
//   Thumb: bg-muted-foreground/30 rounded-full
//   Native scrolling behavior preserved

type ScrollOrientation = "vertical" | "horizontal" | "both"

interface ScrollAreaBlockProps {
  children: React.ReactNode
  /** Scroll direction(s) to enable */
  orientation?: ScrollOrientation
  /** Fixed height for the scroll container */
  height?: string | number
  /** Fixed width for the scroll container */
  width?: string | number
  className?: string
}

export function ScrollAreaBlock({
  children,
  orientation = "vertical",
  height,
  width,
  className,
}: ScrollAreaBlockProps) {
  const style: React.CSSProperties = {}
  if (height) style.height = typeof height === "number" ? `${height}px` : height
  if (width) style.width = typeof width === "number" ? `${width}px` : width

  return (
    <ShadcnScrollArea
      className={cn("overflow-hidden", className)}
      style={style}
    >
      {children}

      {(orientation === "vertical" || orientation === "both") && (
        <ScrollBar orientation="vertical" />
      )}
      {(orientation === "horizontal" || orientation === "both") && (
        <ScrollBar orientation="horizontal" />
      )}
    </ShadcnScrollArea>
  )
}
