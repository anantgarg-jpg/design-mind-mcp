import { cn } from "@/lib/utils"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Resizable/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20
//
// INVARIANTS (meta.yaml):
//   Layout: flex h-full
//   Handle: w-1 bg-border hover:bg-primary/50 cursor-col-resize
//   Min/max size constraints enforced on each panel

export interface ResizablePanelConfig {
  /** Default size as a percentage (0-100) */
  defaultSize: number
  /** Minimum size as a percentage */
  minSize?: number
  /** Maximum size as a percentage */
  maxSize?: number
  children: React.ReactNode
  className?: string
}

interface ResizableBlockProps {
  panels: ResizablePanelConfig[]
  /** Split direction */
  direction?: "horizontal" | "vertical"
  /** Called when panel layout changes — sizes array for persistence */
  onLayout?: (sizes: number[]) => void
  className?: string
}

export function ResizableBlock({
  panels,
  direction = "horizontal",
  onLayout,
  className,
}: ResizableBlockProps) {
  return (
    <ResizablePanelGroup
      direction={direction}
      onLayout={onLayout}
      className={cn("flex h-full", className)}
    >
      {panels.map((panel, i) => (
        <div key={i} className="contents">
          {i > 0 && (
            <ResizableHandle
              className={cn(
                direction === "horizontal" ? "w-1" : "h-1",
                "bg-border hover:bg-primary/50",
                direction === "horizontal" ? "cursor-col-resize" : "cursor-row-resize",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            />
          )}
          <ResizablePanel
            defaultSize={panel.defaultSize}
            minSize={panel.minSize}
            maxSize={panel.maxSize}
            className={cn(panel.className)}
          >
            {panel.children}
          </ResizablePanel>
        </div>
      ))}
    </ResizablePanelGroup>
  )
}
