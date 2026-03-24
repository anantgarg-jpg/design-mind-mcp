import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary'
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        {
          'bg-primary/10 text-primary': variant === 'default',
          'border border-border text-muted-foreground': variant === 'outline',
          'bg-muted text-muted-foreground': variant === 'secondary',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
