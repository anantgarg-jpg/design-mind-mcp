import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'border border-border bg-transparent text-foreground hover:bg-muted': variant === 'outline',
          'bg-transparent text-foreground hover:bg-muted': variant === 'ghost',
        },
        {
          'h-9 px-3 text-sm': size === 'md',
          'h-7 px-2 text-xs': size === 'sm',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
