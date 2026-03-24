import { cn } from "@/lib/utils"
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Dialog/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 14, 17, 18, 20
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg shadow-lg z-40 bg-card max-w-lg
//   Backdrop: z-30 bg-background/80 backdrop-blur-sm
//   Close button always present; ESC closes; focus trapped inside

interface DialogBlockProps {
  /** Element that opens the dialog on click */
  trigger: React.ReactNode
  title: string
  /** Optional supporting text below the title */
  description?: string
  children: React.ReactNode
  /** Footer actions — max one primary CTA (rule 14) */
  footer?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function DialogBlock({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  className,
}: DialogBlockProps) {
  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className={cn(
          "rounded-lg shadow-lg bg-card max-w-lg p-6",
          className
        )}
      >
        {/* Close button — always present (invariant) */}
        <DialogClose
          className={cn(
            "absolute right-4 top-4 rounded-md p-1",
            "text-muted-foreground hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">{children}</div>

        {footer && (
          <DialogFooter className="flex gap-3">
            {/* CTA labels: whitespace-nowrap (rule 18) */}
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </ShadcnDialog>
  )
}
