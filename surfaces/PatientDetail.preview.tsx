import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const CARE_GAPS = [
  { name: 'HbA1c Screening', priority: 'High', status: 'In outreach', due: 'Overdue 90d' },
  { name: 'Annual Wellness Visit', priority: 'Medium', status: 'Not started', due: 'Due Apr 15' },
  { name: 'Retinal Eye Exam', priority: 'Low', status: 'Scheduled', due: 'Apr 22' },
]

const TASKS = [
  { text: 'Call back — transport barrier discussed', due: 'Today 2pm', done: false },
  { text: 'Confirm HbA1c appointment', due: 'Mar 26', done: false },
]

export default function PatientDetailPreview() {
  const [ackd, setAckd] = useState(false)
  const [closedGaps, setClosedGaps] = useState<Set<number>>(new Set())
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set())

  return (
    <div className="space-y-4 text-sm">

      {/* Entity header */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold shrink-0">TJ</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-base">Taylor, James</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
            <span>MRN 400-291</span>
            <span>DOB Mar 14, 1962</span>
            <span>High risk · 3 open gaps</span>
          </div>
        </div>
        <Badge variant="outline" className="border-red-300 text-red-600 shrink-0">High Risk</Badge>
      </div>

      {/* Alert banner */}
      {!ackd && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-destructive">Critical — HbA1c reading requires review</p>
              <p className="text-xs text-destructive/80 mt-0.5">Result flagged by lab. Clinical review required before scheduling.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setAckd(true)}>
            Acknowledge
          </Button>
        </div>
      )}

      {/* Care gaps */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Care Gaps</p>
        <div className="rounded-lg border border-border overflow-hidden">
          {CARE_GAPS.filter((_, i) => !closedGaps.has(i)).map((g, idx) => {
            const i = CARE_GAPS.indexOf(g)
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.status} · {g.due}</p>
                </div>
                <span className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded-full border shrink-0',
                  g.priority === 'High' ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : g.priority === 'Medium' ? 'bg-muted text-muted-foreground border-border'
                  : 'bg-success/10 text-success border-success/30'
                )}>{g.priority}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
                  onClick={() => setClosedGaps(prev => new Set(prev).add(i))}>
                  Close Gap
                </Button>
              </div>
            )
          })}
          {closedGaps.size === CARE_GAPS.length && (
            <div className="px-4 py-3 text-center text-xs text-muted-foreground bg-card">No open care gaps</div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasks</p>
          <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2">
            <Plus className="h-3 w-3" />Add Task
          </Button>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          {TASKS.filter((_, i) => !doneTasks.has(i)).map((t, idx) => {
            const i = TASKS.indexOf(t)
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{t.text}</p>
                  <p className="text-xs text-muted-foreground">{t.due}</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
                  onClick={() => setDoneTasks(prev => new Set(prev).add(i))}>
                  Complete
                </Button>
              </div>
            )
          })}
          {doneTasks.size === TASKS.length && (
            <div className="px-4 py-3 text-center text-xs text-muted-foreground bg-card">No open tasks</div>
          )}
        </div>
      </div>

    </div>
  )
}
