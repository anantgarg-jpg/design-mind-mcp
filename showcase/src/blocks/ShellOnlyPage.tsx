import React from 'react'
import { cn } from '@/lib/utils'

interface ShellOnlyPageProps {
  name: string
  level: 'composite' | 'domain'
  shellPath: string
}

const LEVEL_COLORS: Record<string, string> = {
  primitive: 'bg-accent text-accent-foreground border border-accent-foreground/20',
  composite: 'bg-success/10 text-success border border-success/30',
  domain: 'bg-[var(--alert-light)] text-alert border border-alert/30',
}

export function ShellOnlyPage({ name, level, shellPath }: ShellOnlyPageProps) {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-semibold text-foreground">{name}</h1>
          <span className={cn(
            'inline-flex items-center text-sm font-semibold px-2 py-0.5 rounded-full capitalize',
            LEVEL_COLORS[level]
          )}>
            {level}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-6 max-w-lg">
        <p className="text-base font-semibold text-foreground mb-2">
          Shell-only implementation
        </p>
        <p className="text-base text-muted-foreground leading-relaxed mb-4">
          This block's implementation lives in the shell project. The genome block
          (meta.yaml) is ratified — the component.tsx re-exports from the shell.
          To test it, run the shell project.
        </p>
        <p className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
          {shellPath}
        </p>
      </div>
    </div>
  )
}
