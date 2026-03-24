import { cn } from "@/lib/utils"
import {
  Collapsible as ShadcnCollapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Collapsible/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   No visual border by default
//   Trigger is any element
//   Content animated open/close
//
// Trigger must be keyboard accessible with aria-expanded.

interface CollapsibleProps {
  /** Element that toggles the collapsible — must be keyboard accessible */
  trigger: React.ReactNode
  children: React.ReactNode
  /** Controlled open state */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean
  className?: string
}

export function Collapsible({
  trigger,
  children,
  open,
  onOpenChange,
  defaultOpen = false,
  className,
}: CollapsibleProps) {
  return (
    <ShadcnCollapsible
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
      className={cn(className)}
    >
      <CollapsibleTrigger asChild>{trigger}</CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {children}
      </CollapsibleContent>
    </ShadcnCollapsible>
  )
}
