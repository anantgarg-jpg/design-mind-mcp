import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-normal transition-[color,background-color,border-color,transform] duration-100 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground" +
          " focus-visible:ring-ring" +
          " hover:bg-primary/90" +
          " active:bg-primary/85 active:scale-[0.97]",
        destructive:
          "bg-destructive text-destructive-foreground" +
          " focus-visible:ring-ring-destructive" +
          " hover:bg-destructive/90" +
          " active:bg-destructive/85 active:scale-[0.97]",
        outline:
          "border border-border bg-transparent text-foreground" +
          " focus-visible:ring-ring" +
          " hover:bg-foreground/[0.04]" +
          " active:bg-foreground/[0.08] active:scale-[0.97]",
        secondary:
          "bg-foreground/[0.06] text-foreground/80" +
          " focus-visible:ring-ring" +
          " hover:bg-foreground/[0.1] hover:text-foreground" +
          " active:bg-foreground/[0.14] active:scale-[0.97]",
        ghost:
          "text-foreground/70" +
          " focus-visible:ring-ring" +
          " hover:bg-foreground/[0.06] hover:text-foreground" +
          " active:bg-foreground/[0.1] active:scale-[0.97]",
        link:
          "text-primary underline-offset-2" +
          " focus-visible:ring-ring" +
          " hover:underline hover:text-primary/80" +
          " active:text-primary/70",
      },
      size: {
        sm:        "h-6 px-1.5 text-xs [&_svg]:size-3",
        default:   "h-8 px-2.5 text-[13px] [&_svg]:size-4",
        lg:        "h-10 px-3.5 text-[15px] [&_svg]:size-[18px]",
        "icon-sm": "h-6 w-6 p-0 [&_svg]:size-3",
        icon:      "h-8 w-8 p-0 [&_svg]:size-4",
        "icon-lg": "h-10 w-10 p-0 [&_svg]:size-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
