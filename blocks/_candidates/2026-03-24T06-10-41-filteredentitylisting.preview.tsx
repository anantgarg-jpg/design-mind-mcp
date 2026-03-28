import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

const FILTERS = [
  { id: 'clinical',    label: 'Clinical',    count: 4 },
  { id: 'preventive',  label: 'Preventive',  count: 3 },
  { id: 'behavioral',  label: 'Behavioral',  count: 2 },
]

const ROWS = [
  { id: 1, name: 'HbA1c Screening',         type: 'clinical',   due: 'Overdue',       dueClass: 'text-destructive' },
  { id: 2, name: 'Annual Wellness Visit',    type: 'preventive', due: 'Due Mar 30',    dueClass: 'text-amber-500' },
  { id: 3, name: 'Colorectal Screening',     type: 'preventive', due: 'Due Apr 15',    dueClass: 'text-muted-foreground' },
  { id: 4, name: 'PHQ-9 Depression Screen',  type: 'behavioral', due: 'Due Apr 20',    dueClass: 'text-muted-foreground' },
  { id: 5, name: 'Blood Pressure Check',     type: 'clinical',   due: 'Due May 1',     dueClass: 'text-muted-foreground' },
]

export default function FilteredEntityListingPreview() {
  const [active, setActive] = useState<string[]>([])

  const toggle = (id: string) =>
    setActive(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const visible = active.length === 0 ? ROWS : ROWS.filter(r => active.includes(r.type))

  return (
    <div className="rounded-lg border border-border/30 bg-card shadow-sm flex flex-col overflow-hidden h-64">
      {/* Fixed header band */}
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-foreground">Care Gaps</span>
        <span className="text-xs text-muted-foreground">{visible.length} results</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar */}
        <div className="w-36 border-r border-border overflow-y-auto shrink-0 py-2">
          <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Type</p>
          {FILTERS.map(f => {
            const on = active.includes(f.id)
            return (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 min-h-[44px] text-left text-xs transition-colors',
                  on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {/* sr-only real checkbox + visible custom visual (C21 touch target) */}
                <input type="checkbox" checked={on} onChange={() => toggle(f.id)} className="sr-only" />
                <span aria-hidden className={cn(
                  'h-3.5 w-3.5 shrink-0 rounded-sm border transition-colors',
                  on ? 'bg-primary border-primary' : 'border-border'
                )} />
                <span className="flex-1">{f.label}</span>
                <span className="text-[10px] text-muted-foreground">{f.count}</span>
              </button>
            )
          })}
        </div>

        {/* Full-width row buttons */}
        <div className="flex-1 overflow-y-auto">
          {visible.map(row => (
            <button
              key={row.id}
              className="w-full flex items-center gap-3 px-4 min-h-[44px] text-left hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset border-b border-border/50 last:border-b-0 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{row.name}</p>
                <p className={cn('text-xs', row.dueClass)}>{row.due}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
