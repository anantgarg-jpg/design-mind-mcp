import { Toaster as ShadcnToaster } from "@/components/ui/sonner"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Sonner/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 14, 19
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg shadow-lg z-50 bg-card border p-4
//   Position: bottom-right
//   Auto-dismiss: 5s default
//
// Usage:
//   Mount <Sonner /> once in the layout.
//   Trigger toasts via: toast("Message"), toast.success("Saved"),
//   toast.error("Failed"), toast.warning("Careful")

interface SonnerProps {
  /** Maximum visible toasts at once */
  visibleToasts?: number
  /** Position on screen */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

export function Sonner({
  visibleToasts = 3,
  position = "bottom-right",
}: SonnerProps) {
  return (
    <ShadcnToaster
      visibleToasts={visibleToasts}
      position={position}
      toastOptions={{
        classNames: {
          toast: "rounded-lg shadow-lg bg-card border p-4 text-base",
          title: "text-foreground font-semibold",
          description: "text-muted-foreground text-sm",
          success: "border-success",
          error: "border-destructive",
          warning: "border-warning",
          actionButton: "whitespace-nowrap",
        },
      }}
    />
  )
}
