import React from 'react'
import { cn } from '@/lib/utils'
import { Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ArtifactEntityCardPreview() {
  return (
    <div className="max-w-xs">
      <div className="rounded-lg border border-border/30 bg-card shadow-sm flex flex-col overflow-hidden">
        {/* Fixed identity header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            TJ
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm">Taylor, James</p>
            <p className="text-xs text-muted-foreground">MRN 400-291 · DOB 1962-03-14</p>
          </div>
          <Badge variant="outline" className="ml-auto shrink-0 text-xs border-amber-400 text-amber-600">
            High Risk
          </Badge>
        </div>
        {/* flex-1 scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {[
            { Icon: Phone,    label: 'Phone',   value: '(555) 843-2901' },
            { Icon: Mail,     label: 'Email',   value: 'j.taylor@email.com' },
            { Icon: MapPin,   label: 'Address', value: '412 Oak St, Springfield' },
            { Icon: Calendar, label: 'Last visit', value: 'Feb 14, 2026' },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-b-0">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
              <span className="text-xs text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <p className={cn('text-xs text-muted-foreground mt-2 text-center')}>
        Card boundary distinguishes entity detail from full-bleed dashboard surfaces
      </p>
    </div>
  )
}
