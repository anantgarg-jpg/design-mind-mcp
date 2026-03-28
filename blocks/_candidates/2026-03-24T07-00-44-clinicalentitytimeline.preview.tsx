import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Phone, ClipboardList, Activity, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const EVENTS = [
  {
    id: 1,
    type: 'Assessment',
    Icon: ClipboardList,
    dotColor: 'bg-blue-500',
    accent: 'border-l-blue-500',
    date: 'Mar 18, 2026',
    fullDate: 'Mar 18, 2026 · 10:24 AM',
    summary: 'PHQ-9 completed — Score 12 (Moderate)',
    actor: 'Dr. M. Rivera',
  },
  {
    id: 2,
    type: 'Outreach',
    Icon: Phone,
    dotColor: 'bg-green-500',
    accent: 'border-l-green-500',
    date: 'Mar 15, 2026',
    fullDate: 'Mar 15, 2026 · 2:05 PM',
    summary: 'Phone call — Reached, scheduled follow-up',
    actor: 'T. Chen',
  },
  {
    id: 3,
    type: 'Care Gap',
    Icon: AlertCircle,
    dotColor: 'bg-amber-500',
    accent: 'border-l-amber-500',
    date: 'Mar 10, 2026',
    fullDate: 'Mar 10, 2026 · 9:00 AM',
    summary: 'HbA1c Screening flagged as overdue',
    actor: 'System',
  },
  {
    id: 4,
    type: 'Risk Change',
    Icon: Activity,
    dotColor: 'bg-red-500',
    accent: 'border-l-red-500',
    date: 'Feb 28, 2026',
    fullDate: 'Feb 28, 2026 · 8:00 AM',
    summary: 'Risk tier escalated: Medium → High',
    actor: 'System',
  },
]

export default function ClinicalEntityTimelinePreview() {
  const [expanded, setExpanded] = useState<number | null>(1)

  return (
    <div className="rounded-lg border border-border/30 bg-card shadow-sm flex flex-col overflow-hidden max-w-sm">
      {/* ArtifactEntityCard identity header */}
      <div className="px-4 py-2.5 border-b border-border shrink-0">
        <p className="text-sm font-semibold text-foreground">Clinical Timeline</p>
        <p className="text-xs text-muted-foreground">Taylor, James · {EVENTS.length} events</p>
      </div>

      {/* Timeline body */}
      <div className="overflow-y-auto px-4 py-3">
        {EVENTS.map((event, i) => {
          const isExpanded = expanded === event.id
          const isLast = i === EVENTS.length - 1
          return (
            <div key={event.id} className="flex gap-3">
              {/* Spine */}
              <div className="flex flex-col items-center pt-1">
                <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full shrink-0', event.dotColor)} />
                {!isLast && <span aria-hidden className="w-px flex-1 bg-border/60 my-1 min-h-[12px]" />}
              </div>

              {/* Content */}
              <div className={cn('flex-1 pb-3', isLast && 'pb-0')}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : event.id)}
                  className="w-full text-left rounded focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <event.Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-muted-foreground">{event.type}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">{event.date}</span>
                      {isExpanded
                        ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                        : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{event.summary}</p>
                </button>

                {isExpanded && (
                  <div className={cn('mt-2 pl-3 border-l-2 py-1', event.accent)}>
                    <p className="text-xs text-muted-foreground">{event.fullDate}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Recorded by {event.actor}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
