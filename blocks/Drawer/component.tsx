import { cn } from "@/lib/utils"
import {
  Drawer as ShadcnDrawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Drawer/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 14, 18, 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: rounded-t-lg bg-card z-40
//   Drag handle: w-12 h-1.5 rounded-full bg-muted (always visible)
//   Snap points for partial-open states

interface DrawerBlockProps {
  /** Element that opens the drawer on click */
  trigger: React.ReactNode
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Snap points for partial open heights (e.g. [0.5, 1]) */
  snapPoints?: number[]
  className?: string
}

export function DrawerBlock({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  snapPoints,
  className,
}: DrawerBlockProps) {
  return (
    <ShadcnDrawer
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent
        className={cn("rounded-t-lg bg-card", className)}
      >
        {/* Drag handle — always visible (invariant) */}
        <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />

        {(title || description) && (
          <DrawerHeader className="text-left">
            {title && (
              <DrawerTitle className="text-lg font-semibold text-foreground">
                {title}
              </DrawerTitle>
            )}
            {description && (
              <DrawerDescription className="text-sm text-muted-foreground">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
        )}

        <div className="px-4 pb-4">{children}</div>

        {footer && (
          <DrawerFooter className="flex gap-3 px-4 pb-6">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </ShadcnDrawer>
  )
}
