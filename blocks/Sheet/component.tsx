import { cn } from "@/lib/utils"
import {
  Sheet as ShadcnSheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Sheet/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20
//
// INVARIANTS (meta.yaml):
//   Panel: bg-card z-40 shadow-lg inset-y-0
//   Width: min-w-[320px] max-w-[540px]
//   Backdrop: z-30 bg-black/50

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Panel slide direction */
  side?: "right" | "left" | "top" | "bottom"
  title: string
  description?: string
  trigger?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  trigger,
  children,
  className,
}: SheetProps) {
  return (
    <ShadcnSheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side={side}
        className={cn(
          // TODO: replace max-w-[540px] with design token when sheet max-width scale is added (540px; max-w-lg = 512px, max-w-xl = 576px — neither matches)
          "bg-card shadow-lg min-w-80 max-w-[540px]",
          "focus-visible:outline-none",
          className,
        )}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </ShadcnSheet>
  )
}
