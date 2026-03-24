import { cn } from "@/lib/utils"
import { Separator as ShadcnSeparator } from "@/components/ui/separator"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Separator/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
//
// INVARIANTS (meta.yaml):
//   bg-border color token
//   Horizontal: h-[1px] w-full
//   Vertical: w-[1px] h-full

interface SeparatorProps {
  orientation?: "horizontal" | "vertical"
  className?: string
}

export function Separator({
  orientation = "horizontal",
  className,
}: SeparatorProps) {
  return (
    <ShadcnSeparator
      orientation={orientation}
      decorative
      className={cn("bg-border", className)}
    />
  )
}
