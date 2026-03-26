import React from 'react'
import { cn } from '@/lib/utils'
import { Phone, MessageSquare, FileText, Mail } from 'lucide-react'

const LOG = [
  { initials: 'TJ', name: 'Taylor, James', gap: 'HbA1c Screening', type: 'Phone Call', Icon: Phone, outcome: 'Reached', outcomeClass: 'text-success', coordinator: 'M. Rivera', time: '11:42 AM', warn: false },
  { initials: 'LP', name: 'Lopes, Patricia', gap: 'Annual Wellness', type: 'Portal Message', Icon: MessageSquare, outcome: 'No Answer', outcomeClass: 'text-amber-500', coordinator: 'M. Rivera', time: '10:15 AM', warn: true },
  { initials: 'KC', name: 'Kim, Christine', gap: 'Diabetes Mgmt', type: 'Phone Call', Icon: Phone, outcome: 'Left Voicemail', outcomeClass: 'text-muted-foreground', coordinator: 'M. Rivera', time: '9:58 AM', warn: false },
  { initials: 'RW', name: 'Wallace, Raymond', gap: 'Colorectal Screen', type: 'Letter', Icon: FileText, outcome: 'Sent', outcomeClass: 'text-muted-foreground', coordinator: 'T. Chen', time: '9:03 AM', warn: false },
  { initials: 'SE', name: 'Evans, Sandra', gap: 'Breast Cancer Screen', type: 'Email', Icon: Mail, outcome: 'Sent', outcomeClass: 'text-muted-foreground', coordinator: 'T. Chen', time: '8:30 AM', warn: false },
]

export default function OutreachLogPreview() {
  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-foreground">Today's Outreach</span>
        <span className="text-xs text-muted-foreground">Last 24 h · read-only</span>
      </div>
      {LOG.map((r, i) => (
        <div key={i} className={cn(
          'flex items-center gap-3 px-4 py-3 bg-card border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/40 transition-colors',
          r.warn && 'border-l-2 border-l-amber-400 pl-[14px]'
        )}>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">{r.initials}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.gap}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <r.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{r.type}</span>
          </div>
          <span className={cn('text-xs font-medium shrink-0', r.outcomeClass)}>{r.outcome}</span>
          <div className="text-xs text-muted-foreground text-right shrink-0">
            <p>{r.coordinator}</p>
            <p>{r.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
