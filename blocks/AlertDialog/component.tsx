import { cn } from "@/lib/utils"
import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/AlertDialog/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 9, 14, 16, 17, 18, 21
//
// INVARIANTS (meta.yaml):
//   rounded-lg shadow-lg container
//   z-40 dialog layer, z-30 backdrop overlay
//   Cancel action always present
//
// COPY RULES:
//   Header states consequence — NEVER "Are you sure?" (rule 16)
//   Action label matches consequence (rule 16)
//   Secondary button says "Close" not "Cancel" (rule 17)

interface AlertDialogProps {
  /** Trigger element that opens the dialog */
  trigger: React.ReactNode
  /** Consequence-describing title — never "Are you sure?" */
  title: string
  /** Supporting description of what will happen */
  description: string
  /** Label for the confirm action — must match the consequence */
  actionLabel: string
  onAction: () => void
  /** Use "destructive" for delete/remove actions */
  variant?: "destructive" | "default"
  className?: string
}

export function AlertDialog({
  trigger,
  title,
  description,
  actionLabel,
  onAction,
  variant = "destructive",
  className,
}: AlertDialogProps) {
  return (
    <ShadcnAlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent
        className={cn("rounded-lg shadow-lg z-40", className)}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Rule 17: secondary button says "Close" not "Cancel" */}
          <AlertDialogCancel asChild>
            <Button variant="outline">{/* Rule 17 */}Close</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild onClick={onAction}>
            <Button variant={variant === "destructive" ? "destructive" : "primary"}>
              {actionLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  )
}
