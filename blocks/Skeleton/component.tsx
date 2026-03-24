import { cn } from "@/lib/utils"
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Skeleton/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
//
// INVARIANTS (meta.yaml):
//   bg-muted rounded-md animate-pulse

interface SkeletonProps {
  /** Width class, e.g. "w-full", "w-32" */
  width?: string
  /** Height class, e.g. "h-4", "h-10" */
  height?: string
  /** Renders as a circle (rounded-full) for avatar placeholders */
  circle?: boolean
  className?: string
}

export function Skeleton({
  width = "w-full",
  height = "h-4",
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <ShadcnSkeleton
      className={cn(
        "bg-muted animate-pulse",
        circle ? "rounded-full" : "rounded-md",
        width,
        height,
        className,
      )}
    />
  )
}
