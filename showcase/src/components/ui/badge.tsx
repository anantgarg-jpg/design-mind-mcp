import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      badgeColor: {
        blue: "",
        red: "",
        yellow: "",
        orange: "",
        green: "",
        grey: "",
      },
      badgeStyle: {
        subtle: "",
      },
    },
    compoundVariants: [
      // ── Blue ────────────────────────────────────────────────
      { badgeColor: "blue", badgeStyle: "subtle", class: "border-transparent bg-accent text-accent-foreground" },

      // ── Red ─────────────────────────────────────────────────
      { badgeColor: "red", badgeStyle: "subtle", class: "border-transparent bg-[var(--destructive-light)] text-destructive" },

      // ── Yellow ──────────────────────────────────────────────
      { badgeColor: "yellow", badgeStyle: "subtle", class: "border-transparent bg-[var(--warning-light)] text-warning-text" },

      // ── Orange ──────────────────────────────────────────────
      { badgeColor: "orange", badgeStyle: "subtle", class: "border-transparent bg-[var(--alert-light)] text-alert-text" },

      // ── Green ───────────────────────────────────────────────
      { badgeColor: "green", badgeStyle: "subtle", class: "border-transparent bg-[var(--success-light)] text-success-text" },

      // ── Grey ────────────────────────────────────────────────
      { badgeColor: "grey", badgeStyle: "subtle", class: "border-transparent bg-muted text-muted-foreground" },
    ],
    defaultVariants: {
      badgeColor: "blue",
      badgeStyle: "subtle",
    },
  }
)

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, badgeColor, badgeStyle, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ badgeColor, badgeStyle }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
