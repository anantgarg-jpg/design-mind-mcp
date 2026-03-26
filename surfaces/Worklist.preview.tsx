import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const PATIENTS = [
  { initials: 'TJ', name: 'Taylor, James', risk: 'High', riskColor: 'bg-red-500', gaps: 3, topGap: 'HbA1c Screening', gapStatus: 'In outreach', taskDue: 'Today' },
  { initials: 'LP', name: 'Lopes, Patricia', risk: 'High', riskColor: 'bg-red-500', gaps: 2, topGap: 'Annual Wellness', gapStatus: 'No answer ×4', taskDue: 'Today' },
  { initials: 'KC', name: 'Kim, Christine', risk: 'Medium', riskColor: 'bg-amber-500', gaps: 2, topGap: 'Diabetes Mgmt', gapStatus: 'Scheduled', taskDue: 'Mar 26' },
  { initials: 'RW', name: 'Wallace, Raymond', risk: 'Medium', riskColor: 'bg-amber-500', gaps: 1, topGap: 'Colorectal Screen', gapStatus: 'Not started', taskDue: 'Mar 28' },
  { initials: 'SE', name: 'Evans, Sandra', risk: 'Low', riskColor: 'bg-success', gaps: 1, topGap: 'Breast Cancer Screen', gapStatus: 'Scheduled', taskDue: 'Apr 1' },
]

export default function WorklistPreview() {
  const [closed, setClosed] = useState<Set<number>>(new Set())

  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-foreground">Today's Panel</span>
        <span className="text-xs text-muted-foreground">{PATIENTS.length - closed.size} patients requiring action</span>
      </div>
      {PATIENTS.filter((_, i) => !closed.has(i)).map((p, idx) => {
        const i = PATIENTS.indexOf(p)
        return (
          <div key={i} className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors">
            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white', p.risk === 'High' ? 'bg-red-500' : p.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500')}>
              {p.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{p.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 rounded-full inline-block', p.riskColor)} />
                  {p.risk} risk · {p.gaps} gap{p.gaps !== 1 ? 's' : ''}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{p.topGap} · <span className="text-foreground/70">{p.gapStatus}</span></p>
            </div>
            <div className="shrink-0 text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Due {p.taskDue}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs">Schedule</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setClosed(prev => new Set(prev).add(i))}>
                Close Gap
              </Button>
            </div>
          </div>
        )
      })}
      {closed.size === PATIENTS.length && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-card">
          Your panel is clear — no coordinator action required right now.
        </div>
      )}
    </div>
  )
}
