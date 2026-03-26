import React from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckSquare, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ALERTS = [
  { patient: 'Taylor, James', text: 'Critical: HbA1c reading flagged — requires clinical review today', severity: 'critical' },
  { patient: 'Lopes, Patricia', text: 'High: Missed annual wellness — 4th no-answer attempt', severity: 'high' },
]

const GAPS = [
  { patient: 'Kim, Christine', gap: 'Diabetes Mgmt', priority: 'High', status: 'In outreach' },
  { patient: 'Wallace, Raymond', gap: 'Colorectal Screen', priority: 'Medium', status: 'Not started' },
  { patient: 'Evans, Sandra', gap: 'Breast Cancer Screen', priority: 'Medium', status: 'Scheduled' },
]

const TASKS = [
  { patient: 'Taylor, James', task: 'Call back re: transport barrier', due: 'Today 2pm' },
  { patient: 'Lopes, Patricia', task: 'Escalate to clinical team', due: 'Today 4pm' },
]

export default function TodayPreview() {
  return (
    <div className="space-y-5 text-sm">

      {/* Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Alerts</span>
        </div>
        <div className="space-y-2">
          {ALERTS.map((a, i) => (
            <div key={i} className={cn(
              'rounded-lg border px-4 py-3 flex items-start justify-between gap-3',
              a.severity === 'critical'
                ? 'border-destructive/40 bg-destructive/5'
                : 'border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20'
            )}>
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium', a.severity === 'critical' ? 'text-destructive' : 'text-amber-700 dark:text-amber-400')}>
                  {a.patient}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.text}</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs">
                Acknowledge
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Care gaps */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">High-Urgency Gaps</span>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          {GAPS.map((g, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border last:border-b-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{g.patient}</p>
                <p className="text-xs text-muted-foreground">{g.gap}</p>
              </div>
              <span className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded-full border shrink-0',
                g.priority === 'High'
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-muted text-muted-foreground border-border'
              )}>{g.priority}</span>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{g.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks due today */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasks Due Today</span>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          {TASKS.map((t, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border last:border-b-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{t.patient}</p>
                <p className="text-xs text-muted-foreground">{t.task}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{t.due}</span>
              <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs">Done</Button>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
