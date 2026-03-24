import React from 'react'
import { cn } from '@/lib/utils'

interface FixtureProps {
  label: string
  children: React.ReactNode
  bg?: string
}

export function Fixture({ label, children, bg = 'bg-card' }: FixtureProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className={cn('rounded-lg border border-border p-4', bg)}>
        {children}
      </div>
    </div>
  )
}

interface PageHeaderProps {
  name: string
  level: 'primitive' | 'composite' | 'domain'
  confidence: number
  description: string
}

const LEVEL_COLORS: Record<string, string> = {
  primitive: 'bg-accent text-accent-foreground border border-accent-foreground/20',
  composite: 'bg-success/10 text-success border border-success/30',
  domain: 'bg-[var(--alert-light)] text-alert border border-alert/30',
}

export function PageHeader({ name, level, confidence, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-semibold text-foreground">{name}</h1>
        <span className={cn(
          'inline-flex items-center text-sm font-semibold px-2 py-0.5 rounded-full capitalize',
          LEVEL_COLORS[level]
        )}>
          {level}
        </span>
        <span className="text-sm text-muted-foreground font-mono">
          confidence {Math.round(confidence * 100)}%
        </span>
      </div>
      <p className="text-base text-muted-foreground max-w-prose">{description}</p>
    </div>
  )
}
