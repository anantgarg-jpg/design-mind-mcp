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

// VARIANT_MAP — translates block variant names to shadcn variant names.
// Keeps shadcn's structural/behavioural styles (transitions, disabled, svg handling).
const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary: "default",
  destructive: "destructive",
  basic: "secondary",
  outline: "outline",
  transparent: "ghost",
  link: "link",
}

// What shadcn defaults this overrides:
// - font-normal declared explicitly (meta.yaml family invariant: font-normal 400 weight).
//   Shadcn base also applies font-normal — explicit declaration here makes the invariant auditable.
// - hover/active/focus declared explicitly here so design system owns them even if
//   shadcn's cva changes. basic/outline/transparent use hover:bg-muted/50,
//   the established hover convention in Select items and similar controls.
// - destructive focus ring uses ring-ring-destructive (separate token from ring-ring).
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:     "bg-primary text-primary-foreground font-normal hover:bg-primary/90 active:bg-primary/85 focus-visible:ring-ring",
  destructive: "bg-destructive text-destructive-foreground font-normal hover:bg-destructive/90 active:bg-destructive/85 focus-visible:ring-ring-destructive",
  basic:       "bg-muted text-foreground font-normal hover:bg-muted/50 active:bg-muted focus-visible:ring-ring",
  outline:     "border border-border bg-transparent text-foreground font-normal hover:bg-muted/50 active:bg-muted focus-visible:ring-ring",
  transparent: "bg-transparent text-foreground/70 font-normal hover:bg-muted/50 hover:text-foreground active:bg-muted focus-visible:ring-ring",
  link:        "bg-transparent text-primary font-normal underline-offset-2 hover:underline hover:text-primary/80 active:text-primary/70 focus-visible:ring-ring",
}

// Selected state for outline variant (toggle-on).
// border-primary (blue-600) + bg-accent (blue-100) + text-accent-foreground (blue-900).
// Overrides outline's border-border and bg-transparent via twMerge (applied after VARIANT_CLASSES).
const OUTLINE_SELECTED_CLASSES = "border-primary bg-accent text-accent-foreground"

// Size overrides — prevents shadcn's cva arbitrary values (text-[13px], text-[15px],
// size-[18px]) from being the sole source of truth. Uses design-system font scale
// (text-sm / text-base / text-lg defined in tailwind.config.ts).
// TODO: replace [&_svg]:size-5 in lg with a design token when an icon size scale is added.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm:      "h-6 px-1.5 text-sm [&_svg]:size-3",
  default: "h-8 px-2.5 text-base [&_svg]:size-4",
  lg:      "h-10 px-3.5 text-lg [&_svg]:size-5",
}

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm:      "h-6 w-6 p-0 [&_svg]:size-3",
  default: "h-8 w-8 p-0 [&_svg]:size-4",
  lg:      "h-10 w-10 p-0 [&_svg]:size-5",
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
  /** Toggle-on state for outline variant — applies border-primary bg-accent (blue-100) */
  selected?: boolean
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "default",
      leftIcon,
      rightIcon,
      iconOnly = false,
      asChild = false,
      selected = false,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const shadcnVariant = VARIANT_MAP[variant]

    return (
      <ShadcnButton
        ref={ref}
        variant={shadcnVariant as any}
        size={undefined}  // SIZE_CLASSES owns sizing; prevent shadcn cva from applying its own
        asChild={asChild}
        aria-pressed={selected || undefined}
        className={cn(
          "rounded-md whitespace-nowrap",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          VARIANT_CLASSES[variant],
          selected && variant === "outline" && OUTLINE_SELECTED_CLASSES,
          iconOnly ? ICON_SIZE_CLASSES[size] : SIZE_CLASSES[size],
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
  },
)
