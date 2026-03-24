import * as React from "react"
import { cn } from "@/lib/utils"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Chart/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19, 20
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg border border-border/40 bg-card p-4 shadow-sm
//   Labels/axes: text-sm text-muted-foreground
//   Responsive width via ChartContainer

interface ChartFrameProps {
  /** Chart title displayed above the visualization */
  title?: string
  /** Optional description below the title */
  description?: string
  /** Recharts chart config mapping series keys to labels and colors */
  config: ChartConfig
  /** Chart height in pixels */
  height?: number
  /** Recharts chart elements (e.g., BarChart, LineChart with children) */
  children: React.ReactNode
  className?: string
}

export function ChartFrame({
  title,
  description,
  config,
  height = 300,
  children,
  className,
}: ChartFrameProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-card p-4 shadow-sm",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-4 flex flex-col gap-1">
          {title && (
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <ChartContainer config={config} className="w-full" style={{ height }}>
        {children}
      </ChartContainer>
    </div>
  )
}

// Re-export chart primitives for composition
export {
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
