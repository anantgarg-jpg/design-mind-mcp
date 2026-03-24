import React from "react"
import { cn } from "@/lib/utils"
import { Button as ShadcnButton } from "@/components/ui/button"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Button/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 14, 18, 20
//
// INVARIANTS (meta.yaml):
//   rounded-md border radius
//   whitespace-nowrap — label never wraps (rule 18)
//   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 (rule 20)
//
// Rule 14: only one primary CTA visible per surface.

type ButtonVariant = "primary" | "destructive" | "basic" | "outline" | "transparent" | "link"
type ButtonSize = "sm" | "default" | "lg"

const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary: "default",
  destructive: "destructive",
  basic: "secondary",
  outline: "outline",
  transparent: "ghost",
  link: "link",
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Icon rendered before the label */
  leftIcon?: React.ReactNode
  /** Icon rendered after the label */
  rightIcon?: React.ReactNode
  /** Renders as a square icon-only button — children should be a single icon */
  iconOnly?: boolean
  /** Renders as a child element (e.g., anchor) instead of button */
  asChild?: boolean
  className?: string
}

export function Button({
  variant = "primary",
  size = "default",
  leftIcon,
  rightIcon,
  iconOnly = false,
  asChild = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const shadcnVariant = VARIANT_MAP[variant]
  const shadcnSize = iconOnly
    ? size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon"
    : size

  return (
    <ShadcnButton
      variant={shadcnVariant as any}
      size={shadcnSize as any}
      asChild={asChild}
      className={cn(
        "rounded-md whitespace-nowrap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        className,
      )}
      {...props}
    >
      {iconOnly ? (
        children
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </ShadcnButton>
  )
}
